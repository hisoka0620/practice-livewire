<?php

use App\Models\Task;
use App\Presenters\TaskCalendarEventMapper;
use Illuminate\Support\Carbon;
use Tests\TestCase;

uses(TestCase::class);

afterEach(function () {
    Carbon::setTestNow();
});

it('maps a task to a FullCalendar event', function () {
    Carbon::setTestNow('2026-09-23 12:00:00');

    $task = new Task([
        'title' => 'Prepare report',
        'priority' => 'high',
        'is_completed' => false,
        'deadline' => '2026-09-23 18:30:00',
    ]);
    $task->id = 42;

    $event = (new TaskCalendarEventMapper)->map($task);

    expect($event)->toBe([
        'id' => '42',
        'title' => 'Prepare report',
        'start' => '2026-09-23T18:30:00',
        'end' => null,
        'color' => '#D97706',
        'extendedProps' => [
            'status' => 'due soon',
            'priority' => 'high',
            'deadline' => '2026-09-23T18:30:00',
            'isOverdue' => false,
            'completed' => false,
        ],
    ]);
});

it('uses the expected color for each task state', function () {
    Carbon::setTestNow('2026-09-23 12:00:00');

    $mapper = new TaskCalendarEventMapper;

    $completedTask = new Task([
        'is_completed' => true,
        'deadline' => Carbon::now()->subHour(),
    ]);
    $overdueTask = new Task([
        'is_completed' => false,
        'deadline' => Carbon::now()->subHour(),
    ]);
    $dueSoonTask = new Task([
        'is_completed' => false,
        'deadline' => Carbon::now()->addHours(12),
    ]);
    $inProgressTask = new Task([
        'is_completed' => false,
        'deadline' => Carbon::now()->addDays(2),
    ]);

    expect($mapper->map($completedTask)['color'])->toBe('#9CA3AF')
        ->and($mapper->map($overdueTask)['color'])->toBe('#991B1B')
        ->and($mapper->map($dueSoonTask)['color'])->toBe('#D97706')
        ->and($mapper->map($inProgressTask)['color'])->toBe('#0369A1');
});
