<?php

namespace App\Livewire;

use Livewire\Component;
use App\Models\Task;

class TodoList extends Component
{
    public $showCreateTaskModal = false;
    public $tasks;

    public function mount()
    {
        $this->showCreateTaskModal = request()->routeIs('todos.create');

        $this->tasks = Task::all();
    }

    public function updatedShowCreateTaskModal($value)
    {
        if (!$value) {
            $this->redirectRoute('todos.index', navigate: true);
        }
    }

    public function render()
    {
        return view('livewire.todo-list', ['tasks' => $this->tasks]);
    }
}
