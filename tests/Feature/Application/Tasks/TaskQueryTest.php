<?php

use App\Application\Tasks\TaskQuery;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Application\Tasks\TaskFilters;
use App\Enums\TaskPriority;

uses(RefreshDatabase::class);

it('returns only the authenticated user tasks', function () {
    $user = User::factory()->create();
    $otherUser = User::factory()->create();

    Task::factory()->for($user)->create(['title' => 'visible task']);
    Task::factory()->for($otherUser)->create(['title' => 'hidden task']);

    $tasks = app(TaskQuery::class)
        ->forUser($user, new TaskFilters())
        ->get();

    expect($tasks)->toHaveCount(1)
        ->and($tasks->first()->title)->toBe('visible task');
});

it('filters tasks by priority', function () {
    $user = User::factory()->create();

    Task::factory()->for($user)->create(['priority' => 'high']);
    Task::factory()->for($user)->create(['priority' => 'low']);

    $filters = new TaskFilters(
        priority: TaskPriority::High,
    );

    $tasks = app(TaskQuery::class)
        ->forUser($user, $filters)
        ->get();

    expect($tasks)->toHaveCount(1)
        ->and($tasks->first()->priority)->toBe('high');
});
