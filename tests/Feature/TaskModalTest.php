<?php

use App\Livewire\TaskModal;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Livewire\Livewire;

uses(RefreshDatabase::class);

it('keeps UTC prefill deadlines as ISO instants and preserves them on save', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    Livewire::test(TaskModal::class)
        ->call('open', null, '2026-09-23T09:30:00.000Z')
        ->assertSet('form.deadline', '2026-09-23T09:30:00.000Z')
        ->set('form.title', 'Prepare report')
        ->call('save');

    $task = Task::query()->firstOrFail();

    expect($task->deadline->utc()->format('Y-m-d H:i:s'))
        ->toBe('2026-09-23 09:30:00');
});

it('preserves a deadline across a UTC and Tokyo date boundary', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    Livewire::test(TaskModal::class)
        ->call('open', null, '2026-09-22T15:30:00.000Z')
        ->assertSet('form.deadline', '2026-09-22T15:30:00.000Z')
        ->set('form.title', 'Prepare report')
        ->call('save');

    $task = Task::query()->firstOrFail();

    expect($task->deadline->utc()->format('Y-m-d H:i:s'))
        ->toBe('2026-09-22 15:30:00');
});

it('serializes an existing Tokyo deadline as a UTC ISO instant', function () {
    $user = User::factory()->create();
    $this->actingAs($user);
    $task = Task::factory()->for($user)->create([
        'deadline' => Carbon::parse('2026-09-23 18:30:00', 'Asia/Tokyo'),
    ]);

    Livewire::test(TaskModal::class)
        ->call('open', $task->id)
        ->assertSet('form.deadline', '2026-09-23T09:30:00.000Z');
});

it('converts a changed ISO deadline back to Tokyo time without changing the instant', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    Livewire::test(TaskModal::class)
        ->call('open')
        ->set('form.title', 'Prepare report')
        ->set('form.deadline', '2026-09-24T17:45:00.000Z')
        ->call('save');

    $task = Task::query()->firstOrFail();

    expect($task->deadline->utc()->format('Y-m-d H:i:s'))
        ->toBe('2026-09-24 17:45:00');
});

it('resets reminder state only when the deadline changes', function () {
    $user = User::factory()->create();
    $this->actingAs($user);
    $task = Task::factory()->for($user)->create([
        'deadline' => Carbon::parse('2026-09-23 18:30:00', 'Asia/Tokyo'),
        'deadline_notified_at' => Carbon::parse('2026-09-23 17:00:00', 'Asia/Tokyo'),
    ]);
    $notifiedAt = '2026-09-23 17:00:00';

    Livewire::test(TaskModal::class)
        ->call('open', $task->id)
        ->call('save');

    expect($task->refresh()->deadline_notified_at)->toBe($notifiedAt);

    Livewire::test(TaskModal::class)
        ->call('open', $task->id)
        ->set('form.deadline', '2026-09-24T09:30:00.000Z')
        ->call('save');

    expect($task->refresh()->deadline_notified_at)->toBeNull();
});

it('resets form values on close and supports reopening for create and edit', function () {
    $user = User::factory()->create();
    $this->actingAs($user);
    $task = Task::factory()->for($user)->create();

    Livewire::test(TaskModal::class)
        ->call('open')
        ->set('form.title', 'Unsaved task')
        ->set('form.deadline', '2026-09-24T17:45:00.000Z')
        ->call('close')
        ->assertSet('show', false)
        ->assertSet('task', null)
        ->assertSet('editTaskId', 0)
        ->assertSet('createTask', 0)
        ->assertSet('form.title', null)
        ->assertSet('form.deadline', null)
        ->call('open', $task->id)
        ->assertSet('form.title', $task->title)
        ->assertSet('editTaskId', $task->id)
        ->set('form.title', 'Updated task')
        ->call('save')
        ->assertSet('show', false)
        ->assertSet('task', null)
        ->assertSet('form.title', null)
        ->call('open')
        ->assertSet('form.title', null)
        ->assertSet('form.deadline', null)
        ->assertSet('createTask', 1);

    expect($task->refresh()->title)->toBe('Updated task');
});

it('shows quick actions only while editing an existing task', function () {
    $user = User::factory()->create();
    $this->actingAs($user);
    $task = Task::factory()->for($user)->create([
        'is_completed' => false,
    ]);

    Livewire::test(TaskModal::class)
        ->call('open', $task->id)
        ->assertSee('Mark complete')
        ->assertSee('Delete task')
        ->call('open')
        ->assertDontSee('Mark complete')
        ->assertDontSee('Mark incomplete')
        ->assertDontSee('Delete task');
});

it('toggles completion without discarding unsaved form edits', function () {
    $user = User::factory()->create();
    $this->actingAs($user);
    $task = Task::factory()->for($user)->create([
        'is_completed' => false,
    ]);

    $component = Livewire::test(TaskModal::class)
        ->call('open', $task->id)
        ->set('form.title', 'Unsaved title')
        ->call('toggleCompletion')
        ->assertSet('task.is_completed', true)
        ->assertSet('form.title', 'Unsaved title')
        ->assertSee('Mark incomplete')
        ->assertDispatched('task-saved');

    expect($task->refresh()->is_completed)->toBeTrue();

    $component->call('toggleCompletion')
        ->assertSet('task.is_completed', false)
        ->assertSee('Mark complete');

    expect($task->refresh()->is_completed)->toBeFalse();
});

it('deletes an edited task immediately and closes the modal', function () {
    $user = User::factory()->create();
    $this->actingAs($user);
    $task = Task::factory()->for($user)->create();

    Livewire::test(TaskModal::class)
        ->call('open', $task->id)
        ->call('deleteTask')
        ->assertDispatched('task-saved')
        ->assertSet('show', false)
        ->assertSet('task', null)
        ->assertSet('form.title', null);

    $this->assertDatabaseMissing('tasks', ['id' => $task->id]);
});

it('does not allow opening another users task for quick actions', function () {
    $user = User::factory()->create();
    $otherUser = User::factory()->create();
    $this->actingAs($user);
    $task = Task::factory()->for($otherUser)->create();

    Livewire::test(TaskModal::class)
        ->call('open', $task->id)
        ->assertForbidden();
});

it('keeps the modal open and reports validation errors when saving an invalid edit', function () {
    $user = User::factory()->create();
    $this->actingAs($user);
    $task = Task::factory()->for($user)->create([
        'is_completed' => false,
    ]);

    Livewire::test(TaskModal::class)
        ->call('open', $task->id)
        ->set('form.title', '')
        ->call('save')
        ->assertHasErrors(['form.title' => 'required'])
        ->assertSet('show', true)
        ->assertSee('Mark complete');

    expect($task->refresh()->title)->not->toBe('');
});
