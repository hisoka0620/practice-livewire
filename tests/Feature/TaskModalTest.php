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
