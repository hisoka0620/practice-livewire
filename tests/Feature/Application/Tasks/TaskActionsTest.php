<?php

use App\Application\Tasks\TaskActions;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;

uses(RefreshDatabase::class);

it('toggles completion for the task owner', function () {
    $user = User::factory()->create();
    $task = Task::factory()->for($user)->create([
        'is_completed' => false,
    ]);

    app(TaskActions::class)->toggleCompletion($user, $task->id);

    expect($task->refresh()->is_completed)->toBeTrue();
});

it('cannot modify another users task', function () {
    $user = User::factory()->create();
    $otherUser = User::factory()->create();

    $task = Task::factory()->for($otherUser)->create();

    app(TaskActions::class)->toggleCompletion($user, $task->id);
})->throws(\Illuminate\Database\Eloquent\ModelNotFoundException::class);

it('updates a task deadline', function () {
    $user = User::factory()->create();
    $task = Task::factory()->for($user)->create();

    $deadline = Carbon::parse('2026-09-20 10:00:00');

    app(TaskActions::class)->updateDeadline(
        $user,
        $task->id,
        $deadline,
    );

    expect($task->refresh()->deadline->equalTo($deadline))->toBeTrue();
});

it('resets deadline_notified_at when the deadline changes', function () {
    $user = User::factory()->create();

    $task = Task::factory()->for($user)->create([
        'deadline' => Carbon::parse('2026-09-20 10:00:00'),
    ]);
    $task->forceFill(['deadline_notified_at' => Carbon::parse('2026-09-19 10:00:00')])->save();

    app(TaskActions::class)->updateDeadline(
        $user,
        $task->id,
        Carbon::parse('2026-10-25 18:00:00'),
    );

    expect($task->refresh()->deadline_notified_at)->toBeNull();
});

it('keeps deadline_notified_at when the deadline is unchanged', function () {
    $user = User::factory()->create();
    $notifiedAt = Carbon::parse('2026-09-19 10:00:00');

    $task = Task::factory()->for($user)->create([
        'deadline' => Carbon::parse('2026-09-20 10:00:00'),
    ]);
    $task->forceFill(['deadline_notified_at' => $notifiedAt])->save();

    app(TaskActions::class)->updateDeadline(
        $user,
        $task->id,
        $task->deadline,
    );

    expect($task->refresh()->deadline_notified_at)->toBe('2026-09-19 10:00:00');
});
