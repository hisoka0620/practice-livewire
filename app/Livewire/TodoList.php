<?php

namespace App\Livewire;

use Livewire\Component;
use App\Models\Task;
use Illuminate\Support\Facades\Auth;

class TodoList extends Component
{
    public $showCreateTaskModal = false;

    public function mount()
    {
        $this->showCreateTaskModal = request()->routeIs('todos.create');
    }

    public function delete($id){

        $task = Task::findOrFail($id);

        $this->authorize('delete', $task);

        $task->delete();
    }

    public function updatedShowCreateTaskModal($value)
    {
        if (!$value) {
            $this->redirectRoute('todos.index', navigate: true);
        }
    }

    public function render()
    {
        return view('livewire.todo-list', ['tasks' => Auth::user()->tasks, ]);
    }
}
