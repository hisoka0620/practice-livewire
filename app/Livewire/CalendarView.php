<?php

namespace App\Livewire;

use App\Application\Tasks\TaskActions;
use App\Application\Tasks\TaskFilters;
use App\Application\Tasks\TaskQuery;
use App\Models\Task;
use App\Presenters\TaskCalendarEventMapper;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Livewire\Attributes\Modelable;
use Livewire\Attributes\On;
use Livewire\Component;

class CalendarView extends Component
{
    #[Modelable]
    public array $filters = [
        'search' => '',
        'priority' => '',
        'taskStatus' => '',
    ];

    public array $calendarEvents = [];

    // 表示中の期間を保持する
    public string $rangeStart = '';

    public string $rangeEnd = '';

    public function updatedFilters(): void
    {
        $this->loadEventsIfRangeSet();
    }

    public function clearFilters(): void
    {
        $this->filters['priority'] = '';
        $this->filters['taskStatus'] = '';
        $this->loadEventsIfRangeSet();
    }

    private function loadEventsIfRangeSet(): void
    {
        if ($this->rangeStart && $this->rangeEnd) {
            $this->loadEvents($this->rangeStart, $this->rangeEnd);
        }
    }

    public function openCreateTaskModal(): void
    {
        $this->dispatch('open-task-modal')->to(TaskModal::class);
    }

    /**
     * カレンダーの表示期間に応じてイベントを動的に取得する
     */
    public function loadEvents(
        string $start,
        string $end
    ): bool {
        if (blank($start) || blank($end)) {
            // 表示期間が未確定（初回のdatesSet前）の場合は何もしない
            return false;
        }

        // 期間を保存しておく
        $this->rangeStart = $start;
        $this->rangeEnd = $end;

        // FullCalendarから送られてくるISO 8601文字列をパース
        $startDate = Carbon::parse($start);
        $endDate = Carbon::parse($end);

        $filters = TaskFilters::fromLivewire(
            search: $this->filters['search'] ?? '',
            priority: $this->filters['priority'] ?? '',
            taskStatus: $this->filters['taskStatus'] ?? '',
            sort: '',
        );

        $taskQuery = app(TaskQuery::class);
        $mapper = app(TaskCalendarEventMapper::class);

        $tasks = $taskQuery
            ->forCalendar(
                Auth::user(),
                $filters,
            );

        // 指定された月（表示範囲内）のイベントだけをクエリで絞り込む
        $this->calendarEvents = $taskQuery
            ->withinPeriod($tasks, $startDate, $endDate)
            ->get()
            ->map(fn(Task $task) => $mapper->map($task))
            ->values()
            ->toArray();

        // JSへ通知
        $this->dispatch('calendarEventsUpdated', events: $this->calendarEvents)->self();

        return true;
    }

    /**
     * ドラッグ&ドロップによる締切日時の変更を保存する
     */
    public function updateTaskDeadline(
        int $taskId,
        string $newDeadline
    ): bool {
        app(TaskActions::class)->updateDeadline(
            Auth::user(),
            $taskId,
            Carbon::parse($newDeadline),
        );

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
        app(TaskActions::class)->toggleCompletion(
            Auth::user(),
            $taskId,
        );

        return $this->loadEvents($this->rangeStart, $this->rangeEnd);
    }

    /**
     * 右クリックメニューからのタスク削除
     */
    public function deleteTask(int $taskId): bool
    {
        app(TaskActions::class)->delete(
            Auth::user(),
            $taskId,
        );

        return $this->loadEvents($this->rangeStart, $this->rangeEnd);
    }

    public function render()
    {
        return view('livewire.calendar-view');
    }
}
