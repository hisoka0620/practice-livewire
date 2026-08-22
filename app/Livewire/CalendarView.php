<?php

namespace App\Livewire;

use App\Models\Task;
use Illuminate\Support\Facades\Auth;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Livewire\Component;
use Carbon\Carbon;
use Livewire\Attributes\Url;
use Livewire\Attributes\On;

class CalendarView extends Component
{
    #[Url(except: '')]
    public string $calendarPriority = '';

    #[Url(except: '')]
    public string $calendarTaskStatus = '';
    public array $calendarEvents = [];

    // 表示中の期間を保持する
    public string $rangeStart = '';
    public string $rangeEnd = '';


    public function mount(): void
    {
    }

    public function updatedcalendarPriority(): void
    {
        if ($this->rangeStart && $this->rangeEnd) {
            $this->loadEvents($this->rangeStart, $this->rangeEnd);
        }
    }

    public function updatedcalendarTaskStatus(): void
    {
        if ($this->rangeStart && $this->rangeEnd) {
            $this->loadEvents($this->rangeStart, $this->rangeEnd);
        }
    }

    public function clearFilters(): void
    {
        $this->reset(['calendarPriority', 'calendarTaskStatus']);
        $this->loadEvents($this->rangeStart, $this->rangeEnd);
    }

    public function openCreateTaskModal(): void
    {
        $this->dispatch('open-task-modal')->to(TaskModal::class);
    }

    private function buildTaskQuery(): HasMany
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();

        return $user
            ->tasks()
            ->filterByPriority($this->calendarPriority)
            ->filterByStatus($this->calendarTaskStatus)
            ->latest();
    }

    /**
     * カレンダーの表示期間に応じてイベントを動的に取得する
     */
    public function loadEvents(string $start, string $end): bool
    {
        if (blank($start) || blank($end)) {
            // 表示期間が未確定（初回のdatesSet前）の場合は何もしない
            return true;
        }

        // 期間を保存しておく
        $this->rangeStart = $start;
        $this->rangeEnd = $end;

        // FullCalendarから送られてくるISO 8601文字列をパース
        $startDate = Carbon::parse($start);
        $endDate = Carbon::parse($end);

        // 指定された月（表示範囲内）のイベントだけをクエリで絞り込む
        $this->calendarEvents = $this->buildTaskQuery()
            ->where('deadline', '>=', $startDate)
            ->where('deadline', '<', $endDate)
            ->get()
            ->map(function (Task $task) {
                $status = str_replace('_', ' ', $task->visualStatus);
                return [
                    'id' => (string) $task->id,
                    'title' => $task->title,
                    'start' => $task->deadline?->format('Y-m-d\TH:i:s'),
                    'end' => null,
                    'color' => $task->is_completed
                        ? '#9CA3AF'
                        : match ($task->deadline_status) {
                            'overdue' => '#991B1B',
                            'due_soon' => '#D97706',
                            default => '#0369A1',
                        },
                    'extendedProps' => [
                        'status' => $status,
                        'priority' => $task->priority,
                        'deadline' => $task->deadline?->format('Y-m-d\TH:i:s'), // ISO形式
                        'isOverdue' => $status === 'overdue',
                        'completed' => $task->is_completed,
                    ],
                ];
            })
            ->values()
            ->toArray();

        // JSへ通知
        $this->dispatch('calendarEventsUpdated', events: $this->calendarEvents)->self();

        return true;
    }

    /**
     * ドラッグ&ドロップによる締切日時の変更を保存する
     */
    public function updateTaskDeadline(int $taskId, string $newDeadline): bool
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();

        $task = $user->tasks()->find($taskId);

        $this->authorize('update', $task);

        $task->deadline = Carbon::parse($newDeadline);
        $task->save();

        // ドラッグ操作を起点にした変更でも、カレンダー全体を再取得して
        // 色分け（overdue/due_soon等のステータス）を最新化しておく
        return $this->loadEvents($this->rangeStart, $this->rangeEnd);
    }

    #[On('task-saved')]
    public function handleTaskSaved(): void
    {
        if ($this->rangeStart && $this->rangeEnd) {
            $this->loadEvents($this->rangeStart, $this->rangeEnd);
        }
    }

    /**
     * 右クリックメニューからの完了/未完了トグル
     */
    public function toggleTaskCompletion(int $taskId): bool
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();

        $task = $user->tasks()->find($taskId);

        $this->authorize('update', $task);

        $task->is_completed = !$task->is_completed;
        $task->save();

        return $this->loadEvents($this->rangeStart, $this->rangeEnd);
    }

    /**
     * 右クリックメニューからのタスク削除
     */
    public function deleteTask(int $taskId): bool
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();

        $task = $user->tasks()->find($taskId);

        $this->authorize('delete', $task);

        $task->delete();

        return $this->loadEvents($this->rangeStart, $this->rangeEnd);
    }

    public function render()
    {
        return view('livewire.calendar-view');
    }
}
