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

    // 表示中の期間を保持する
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

        $validated = Validator::make([
            'start' => $start,
            'end' => $end,
        ], [
            'start' => ['required', 'date_format:'.self::UTC_ISO_DATETIME_FORMAT],
            'end' => ['required', 'date_format:'.self::UTC_ISO_DATETIME_FORMAT],
        ])->validate();

        // FullCalendarから送られてくるISO 8601文字列をパース
        $startDate = Carbon::parse($validated['start'])->setTimezone(config('app.timezone'));
        $endDate = Carbon::parse($validated['end'])->setTimezone(config('app.timezone'));

        Validator::make($validated, [])->after(function ($validator) use ($startDate, $endDate): void {
            if ($endDate->lessThanOrEqualTo($startDate)) {
                $validator->errors()->add('start', '表示期間の開始日時は終了日時より前にしてください。');
            } elseif ($endDate->greaterThan($startDate->copy()->addSeconds(self::MAX_CALENDAR_RANGE_SECONDS))) {
                $validator->errors()->add('end', '表示期間がカレンダーの許容範囲を超えています。');
            }
        })->validate();

        // 期間を保存しておく
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

        // 指定された月（表示範囲内）のイベントだけをクエリで絞り込む
        $this->calendarEvents = $taskQuery
            ->withinPeriod($tasks, $startDate, $endDate)
            ->get()
            ->map(fn (Task $task) => $mapper->map($task))
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
        $validated = Validator::make([
            'newDeadline' => $newDeadline,
        ], [
            'newDeadline' => ['required', 'date_format:'.self::UTC_ISO_DATETIME_FORMAT],
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
     * 右クリックメニューからの完了/未完了トグル
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
     * 右クリックメニューからのタスク削除
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
