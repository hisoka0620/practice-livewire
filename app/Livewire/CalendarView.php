<?php

namespace App\Livewire;

use App\Models\Task;
use Illuminate\Support\Facades\Auth;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Livewire\Attributes\On;
use Livewire\Component;

class CalendarView extends Component
{
    public string $search = '';
    public string $priority = '';
    public string $taskStatus = '';
    public array $calendarEvents = [];

    public function mount(): void
    {
        $this->loadCalendarEvents();
    }

    #[On('calendar-filters-updated')]
    public function updateFilters(
        string $search,
        string $priority,
        string $taskStatus
    ): void {
        $this->search = $search;
        $this->priority = $priority;
        $this->taskStatus = $taskStatus;
        $this->loadCalendarEvents();
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

    private function loadCalendarEvents(): void
    {
        $user = Auth::user();

        if (!$user) {
            $this->calendarEvents = [];
            return;
        }

        $this->calendarEvents = $this->buildTaskQuery()
            ->whereNotNull('deadline')
            ->get()
            ->map(fn(Task $task) => [
                'id' => (string) $task->id,
                'title' => $task->title,
                'start' => $task->deadline?->toJSON(),
                'color' => $task->is_completed
                    ? '#6B7280'
                    : match ($task->deadline_status) {
                        'overdue' => '#dc2626',
                        'due_soon' => '#f59e0b',
                        default => '#0284c7',
                    },
                'extendedProps' => [
                    'priority' => $task->priority,
                    'completed' => $task->is_completed,
                ],
            ])
            ->values()
            ->toArray();

        $this->dispatch('update-calendar', ['events' => $this->calendarEvents]);
    }

    public function render()
    {
        return view('livewire.calendar-view');
    }
}
