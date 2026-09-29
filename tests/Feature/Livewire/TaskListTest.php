<?php

use App\Livewire\TaskList;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Livewire\Livewire;

uses(RefreshDatabase::class);

it('advances from the restored sort on the first interaction', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    Livewire::test(TaskList::class, ['sort' => 'asc'])
        ->assertSee('type="button"', false)
        ->assertSee('aria-label="Sort by deadline, currently ascending"', false)
        ->call('nextSort')
        ->assertSet('sort', 'desc')
        ->assertSee('aria-label="Sort by deadline, currently descending"', false);
});
