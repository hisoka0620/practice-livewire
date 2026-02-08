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

        // include overdue + due soon (deadline < tomorrow)
        $tasks = Task::where('is_completed', false)
            ->whereNotNull('deadline')
            ->where('deadline', '>=', $now)
            ->where('deadline', '<', $deadlineThreshold)
            ->with('user')
            ->get()
            ->groupBy('user_id');

        foreach ($tasks as $userId => $userTasks) {
            $user = $userTasks->first()->user;

            if (! $user) {
                continue;
            }

            if ($user->pushSubscriptions->isEmpty()) {
                continue;
            }

            $dueCount = $userTasks->count();

            $user->notify(new TaskReminderNotification($dueCount));

        }

        $this->info("Task reminders dispatched.");

        return self::SUCCESS;
    }
}
