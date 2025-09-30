<?php

namespace App\Livewire;

use Livewire\Component;
use App\Models\Task;
use Illuminate\Support\Facades\Auth;

class TodoList extends Component
{
    public $showCreateTaskModal = false;
    public $showEditTaskModal = false;
    public ?Task $editingTask = null;

    public function mount($id = null)
    {
        $this->showCreateTaskModal = request()->routeIs('todos.create');

        if (request()->routeIs('todos.edit') && $id) {
            $this->editingTask = Auth::user()->tasks()->findOrFail($id);
            $this->showEditTaskModal = true;
        }
    }

    public function delete($id)
    {
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

    public function updatedShowEditTaskModal($value)
    {
        if (!$value) {
            $this->redirectRoute('todos.index', navigate: true);
        }
    }

    public function render()
    {
        return view('livewire.todo-list')->with(['tasks' => Auth::user()->tasks]);
    }
}
