<?php

use Illuminate\Support\Facades\Route;
use Livewire\Volt\Volt;
use App\Livewire\Counter;
use App\Livewire\TodoList;

Route::get('/', function () {
    return view('welcome');
})->name('home');

Route::get('/counter', Counter::class)
    ->name('counter');

Route::get('/todo-list', TodoList::class)->name('todos.index');

Route::get('/todo-list/create', TodoList::class)
    ->name('todos.create');

Route::view('dashboard', 'dashboard')
    ->middleware(['auth', 'verified'])
    ->name('dashboard');

Route::middleware(['auth'])->group(function () {
    Route::redirect('settings', 'settings/profile');

    Volt::route('settings/profile', 'settings.profile')->name('settings.profile');
    Volt::route('settings/password', 'settings.password')->name('settings.password');
    Volt::route('settings/appearance', 'settings.appearance')->name('settings.appearance');
});

require __DIR__ . '/auth.php';
