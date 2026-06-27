<?php

namespace App\Livewire;

use App\Models\Task;
use Illuminate\Support\Facades\Auth;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Livewire\Attributes\On;
use Livewire\Component;
use Carbon\Carbon;

class CalendarView extends Component
{
    public string $search = '';
    public string $priority = '';
    public string $taskStatus = '';
    public array $calendarEvents = [];

    // 表示中の期間を保持する
    public string $rangeStart = '';
    public string $rangeEnd = '';


    public function mount(): void {}

    #[On('calendar-filters-updated')]
    public function updateFilters(
        string $search,
        string $priority,
        string $taskStatus
    ): void {
        $this->search = $search;
        $this->priority = $priority;
        $this->taskStatus = $taskStatus;

        // 期間が確定していれば即座に再取得
        if ($this->rangeStart && $this->rangeEnd) {
            $this->loadEvents($this->rangeStart, $this->rangeEnd);
        }
    }

    private function buildTaskQuery(): HasMany
    {
        $user = Auth::user();

        return $user
            ->tasks()
            ->when($this->search !== '', fn($query) => $query->filterBySearch($this->search))
            ->when($this->priority !== '', fn($query) => $query->filterByPriority($this->priority))
            ->when($this->taskStatus !== '', fn($query) => $query->filterByStatus($this->taskStatus))
            ->latest();
    }

    /**
     * カレンダーの表示期間に応じてイベントを動的に取得する
     */
    public function loadEvents(string $start, string $end)
    {
        // 期間を保存しておく
        $this->rangeStart = $start;
        $this->rangeEnd = $end;

        // FullCalendarから送られてくるISO 8601文字列をパース
        $startDate = Carbon::parse($start);
        $endDate = Carbon::parse($end);

        // 指定された月（表示範囲内）のイベントだけをクエリで絞り込む
        $this->calendarEvents = $this->buildTaskQuery()
            ->whereBetween('deadline', [$startDate, $endDate])
            ->get()
            ->map(fn(Task $task) => [
                'id' => (string) $task->id,
                'title' => $task->title,
                'start' => $task->deadline?->toJSON(),
                'color' => $task->is_completed
                    ? '#9CA3AF'
                    : match ($task->deadline_status) {
                        'overdue' => '#991B1B',
                        'due_soon' => '#D97706',
                        default => '#0369A1',
                    },
                'extendedProps' => [
                    'status' => str_replace('_', ' ', $task->visualStatus),
                    'priority' => $task->priority,
                    'deadline' => $task->deadline?->toDayDateTimeString(),
                    'isOverdue' => str_replace('_', ' ', $task->visualStatus) === 'overdue',
                    'completed' => $task->is_completed,
                ],
            ])
            ->values()
            ->toArray();

        // JSへ通知
        $this->dispatch('calendarEventsUpdated', events: $this->calendarEvents);
    }

    public function render()
    {
        return view('livewire.calendar-view');
    }
}
