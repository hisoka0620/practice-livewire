<?php

use App\Livewire\CalendarView;
use App\Livewire\TodoList;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Livewire\Livewire;

uses(RefreshDatabase::class);

afterEach(function () {
    Carbon::setTestNow();
});

it('loads the authenticated users tasks from a UTC calendar range', function () {
    Carbon::setTestNow(Carbon::parse('2026-09-22 12:00:00', config('app.timezone')));

    $user = User::factory()->create();
    $otherUser = User::factory()->create();
    $deadline = Carbon::parse('2026-09-23 00:30:00', config('app.timezone'));

    $task = Task::factory()->for($user)->create([
        'deadline' => $deadline,
        'is_completed' => false,
    ]);
    Task::factory()->for($otherUser)->create([
        'deadline' => $deadline,
        'is_completed' => false,
    ]);

    $this->actingAs($user);

    $component = Livewire::test(CalendarView::class)
        ->call('loadEvents', '2026-09-22T15:00:00.000Z', '2026-09-23T15:00:00.000Z');

    $events = $component->get('calendarEvents');

    expect($events)->toHaveCount(1)
        ->and($events[0]['id'])->toBe((string) $task->id)
        ->and($events[0]['start'])->toBe('2026-09-22T15:30:00.000000Z')
        ->and($events[0]['extendedProps']['deadline'])->toBe($events[0]['start']);
});

it('saves a UTC calendar deadline without changing its instant', function () {
    Carbon::setTestNow(Carbon::parse('2026-09-22 12:00:00', config('app.timezone')));

    $user = User::factory()->create();
    $task = Task::factory()->for($user)->create([
        'deadline' => Carbon::parse('2026-09-23 18:30:00', config('app.timezone')),
        'is_completed' => false,
    ]);
    $this->actingAs($user);

    $component = Livewire::test(CalendarView::class)
        ->call('loadEvents', '2026-09-22T15:00:00.000Z', '2026-09-23T15:00:00.000Z')
        ->assertSet('rangeStart', '2026-09-22T15:00:00.000Z')
        ->assertSet('rangeEnd', '2026-09-23T15:00:00.000Z');

    $component->call('updateTaskDeadline', $task->id, '2026-09-24T15:45:00.000Z');

    $savedDeadline = $task->refresh()->deadline;
    $inputInstant = Carbon::parse('2026-09-24T15:45:00.000Z');

    expect($savedDeadline->equalTo($inputInstant))->toBeTrue();
});

it('refreshes the overdue task count after calendar completion', function () {
    Carbon::setTestNow(Carbon::parse('2026-09-29 12:00:00', config('app.timezone')));

    $user = User::factory()->create();
    $task = Task::factory()->for($user)->create([
        'deadline' => now()->subDay(),
        'is_completed' => false,
    ]);
    $this->actingAs($user);

    $todoList = Livewire::test(TodoList::class)
        ->assertSet('overdueTasksCount', 1);

    Livewire::test(CalendarView::class)
        ->call('toggleTaskCompletion', $task->id)
        ->assertDispatched('task-list-updated');

    expect($task->refresh()->is_completed)->toBeTrue();
    expect(app(\App\Application\Tasks\TaskQuery::class)->overdueCount($user))->toBe(0);

    $todoList->dispatch('task-list-updated')->assertSet('overdueTasksCount', 0);
});
