<?php

use App\Application\Tasks\TaskActions;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Auth\Access\AuthorizationException;

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
