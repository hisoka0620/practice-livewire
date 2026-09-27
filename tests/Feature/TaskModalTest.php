<?php

use App\Livewire\TaskModal;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Livewire\Livewire;

uses(RefreshDatabase::class);

it('converts UTC prefill deadlines to local form values and preserves the instant on save', function () {
  $user = User::factory()->create();
  $this->actingAs($user);

  Livewire::test(TaskModal::class)
    ->call('open', null, '2026-09-23T09:30:00.000Z')
    ->assertSet('form.deadline', '2026-09-23T18:30')
    ->set('form.title', 'Prepare report')
    ->call('save');

  $task = Task::query()->firstOrFail();

  expect($task->deadline->utc()->format('Y-m-d H:i:s'))
    ->toBe('2026-09-23 09:30:00');
});

it('preserves a local midnight deadline when the UTC date is the previous day', function () {
  $user = User::factory()->create();
  $this->actingAs($user);

  Livewire::test(TaskModal::class)
    ->call('open', null, '2026-09-22T15:30:00.000Z')
    ->assertSet('form.deadline', '2026-09-23T00:30')
    ->set('form.title', 'Prepare report')
    ->call('save');

  $task = Task::query()->firstOrFail();

  expect($task->deadline->utc()->format('Y-m-d H:i:s'))
    ->toBe('2026-09-22 15:30:00');
});

it('formats an existing task deadline as a local datetime input', function () {
  $user = User::factory()->create();
  $this->actingAs($user);
  $task = Task::factory()->for($user)->create([
    'deadline' => Carbon::parse('2026-09-23 18:30:00', 'Asia/Tokyo'),
  ]);

  Livewire::test(TaskModal::class)
    ->call('open', $task->id)
    ->assertSet('form.deadline', '2026-09-23T18:30');
});
