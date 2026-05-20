<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Task;
use App\Notifications\TaskReminderNotification;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;

class SendTaskReminders extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'tasks:send-reminders';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send webpush reminders to users who have tasks that are due or due soon.';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $now = Carbon::now();
        $deadlineThreshold = $now->copy()->addDay(); // due within 24 hours
        $notifiedTaskCount = 0;

        // Fetch tasks that are not completed, have a deadline, and are due within the next 24 hours
        Task::where('is_completed', false)
            ->whereNotNull('deadline')
            ->whereNull('deadline_notified_at')
            ->where('deadline', '>=', $now)
            ->where('deadline', '<', $deadlineThreshold)
            ->with(['user.pushSubscriptions'])
            ->chunkById(100, function ($tasks) use ($now, &$notifiedTaskCount) {
                $grouped = $tasks->groupBy('user_id');

                foreach ($grouped as $userId => $userTasks) {
                    $user = $userTasks->first()->user;

                    if (!$user || $user->pushSubscriptions->isEmpty()) {
                        continue;
                    }

                    $taskIds = $userTasks->pluck('id');

                    try {
                        // 通知送信前に deadline_notified_at を更新（二重送信防止）

                        $updated = Task::whereIn('id', $taskIds)
                            ->whereNull('deadline_notified_at') // 念のため再チェック
                            ->update(['deadline_notified_at' => $now]);

                        if($updated === 0) {
                            continue;
                        }

                        $user->notify(new TaskReminderNotification($userTasks->count()));

                        $notifiedTaskCount += $userTasks->count();

                        Log::info('Task reminder notification sent', [
                            'user_id'   => $user->id,
                            'due_count' => $userTasks->count(),
                        ]);
                    } catch (\Throwable $e) {
                        // 通知失敗時は deadline_notified_at をリセットして再試行可能にする
                        Task::whereIn('id', $taskIds)
                            ->update(['deadline_notified_at' => null]);

                        Log::error('Failed to send task reminder', [
                            'user_id' => $userId,
                            'task_ids' => $taskIds->toArray(),
                            'error'   => $e->getMessage(),
                        ]);
                    }
                }
            });

        $this->info("Task reminders dispatched. (Notified task count: {$notifiedTaskCount}).");

        return self::SUCCESS;
    }
}
