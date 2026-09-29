<?php

use App\Livewire\TaskList;
use App\Livewire\TodoList;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Livewire\Livewire;

uses(RefreshDatabase::class);

it('restores the deadline sort from the URL', function () {
    $user = User::factory()->create();
    Task::factory()->for($user)->create([
        'title' => 'Later deadline',
        'deadline' => now()->addDays(2),
        'is_completed' => false,
    ]);
    Task::factory()->for($user)->create([
        'title' => 'Earlier deadline',
        'deadline' => now()->addDay(),
        'is_completed' => false,
    ]);

    $this->actingAs($user);

    Livewire::withQueryParams(['sort' => 'asc'])
        ->test(TodoList::class)
        ->assertSet('sort', 'asc')
        ->assertSeeInOrder(['Earlier deadline', 'Later deadline']);
});

it('advances from the restored sort on the first interaction', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    Livewire::test(TaskList::class, ['sort' => 'asc'])
        ->call('nextSort')
        ->assertSet('sort', 'desc');
});
