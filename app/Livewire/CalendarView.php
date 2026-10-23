<?php

namespace App\Livewire;

use App\Application\Tasks\TaskActions;
use App\Application\Tasks\TaskFilters;
use App\Application\Tasks\TaskQuery;
use App\Models\Task;
use App\Presenters\TaskCalendarEventMapper;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Livewire\Attributes\Modelable;
use Livewire\Attributes\On;
use Livewire\Component;

class CalendarView extends Component
{
    private const UTC_ISO_DATETIME_FORMAT = 'Y-m-d\TH:i:s.v\Z';

    private const MAX_CALENDAR_RANGE_DAYS = 42;

    // FullCalendar's 42 calendar days allow up to 48 hours of endpoint UTC offset difference (44 elapsed days).
    private const MAX_ENDPOINT_UTC_OFFSET_DIFFERENCE_HOURS = 48;

    private const MAX_CALENDAR_RANGE_SECONDS = (self::MAX_CALENDAR_RANGE_DAYS * 24 + self::MAX_ENDPOINT_UTC_OFFSET_DIFFERENCE_HOURS) * 60 * 60;

    #[Modelable]
    public array $filters = [
        'search' => '',
        'priority' => '',
        'taskStatus' => '',
    ];

    public array $calendarEvents = [];

    // Keep the period currently displayed on the calendar
    public string $rangeStart = '';

    public string $rangeEnd = '';

    public function updatedFilters(): void
    {
        $this->reloadCurrentRange();
    }

    public function clearFilters(): void
    {
        $this->filters['priority'] = '';
        $this->filters['taskStatus'] = '';
        $this->reloadCurrentRange();
    }

    private function reloadCurrentRange(): void
    {
        if (blank($this->rangeStart) || blank($this->rangeEnd)) {
            return;
        }

        $this->loadEvents($this->rangeStart, $this->rangeEnd);
    }

    private function refreshAfterTaskMutation(): void
    {
        $this->dispatch('task-list-updated')->to(TodoList::class);
        $this->reloadCurrentRange();
    }

    public function openCreateTaskModal(): void
    {
        $this->dispatch('open-task-modal')->to(TaskModal::class);
    }

    /**
     * Load events dynamically according to the calendar display period
     */
    public function loadEvents(
        mixed $start,
        mixed $end
    ): bool {
        $validated = Validator::make([
            'start' => $start,
            'end' => $end,
        ], [
            'start' => ['bail', 'required', 'string', 'date_format:'.self::UTC_ISO_DATETIME_FORMAT],
            'end' => ['bail', 'required', 'string', 'date_format:'.self::UTC_ISO_DATETIME_FORMAT],
        ])->validate();

        // Parse the ISO 8601 strings sent from FullCalendar
        $startDate = Carbon::parse($validated['start'])->setTimezone(config('app.timezone'));
        $endDate = Carbon::parse($validated['end'])->setTimezone(config('app.timezone'));

        Validator::make($validated, [])->after(function ($validator) use ($startDate, $endDate): void {
            if ($endDate->lessThanOrEqualTo($startDate)) {
                $validator->errors()->add('start', '表示期間の開始日時は終了日時より前にしてください。');
            } elseif ($endDate->greaterThan($startDate->copy()->addSeconds(self::MAX_CALENDAR_RANGE_SECONDS))) {
                $validator->errors()->add('end', '表示期間がカレンダーの許容範囲を超えています。');
            }
        })->validate();

        // Keep the period for later reloads
        $this->rangeStart = $validated['start'];
        $this->rangeEnd = $validated['end'];

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

        // Filter the query to only the tasks within the displayed period
        $this->calendarEvents = $taskQuery
            ->withinPeriod($tasks, $startDate, $endDate)
            ->get()
            ->map(fn (Task $task) => $mapper->map($task))
            ->values()
            ->toArray();

        // Notify the JS side
        $this->dispatch('calendarEventsUpdated', events: $this->calendarEvents)->self();

        return true;
    }

    /**
     * Persist a deadline change made by drag & drop
     */
    public function updateTaskDeadline(
        int $taskId,
        mixed $newDeadline
    ): bool {
        $validated = Validator::make([
            'newDeadline' => $newDeadline,
        ], [
            'newDeadline' => ['bail', 'required', 'string', 'date_format:'.self::UTC_ISO_DATETIME_FORMAT],
        ])->validate();

        app(TaskActions::class)->updateDeadline(
            Auth::user(),
            $taskId,
            Carbon::parse($validated['newDeadline'])->setTimezone(config('app.timezone')),
        );

        $this->refreshAfterTaskMutation();

        return true;
    }

    #[On('task-saved')]
    public function handleTaskSaved(): void
    {
        $this->reloadCurrentRange();
    }

    /**
     * Toggle completion from the context menu
     */
    public function toggleTaskCompletion(int $taskId): bool
    {
        app(TaskActions::class)->toggleCompletion(
            Auth::user(),
            $taskId,
        );

        $this->refreshAfterTaskMutation();

        return true;
    }

    /**
     * Delete a task from the context menu
     */
    public function deleteTask(int $taskId): bool
    {
        app(TaskActions::class)->delete(
            Auth::user(),
            $taskId,
        );

        $this->refreshAfterTaskMutation();

        return true;
    }

    public function render()
    {
        return view('livewire.calendar-view');
    }
}
