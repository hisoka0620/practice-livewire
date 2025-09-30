<?php

namespace App\Livewire;

use App\Livewire\Forms\TaskForm;
use App\Models\Task;
use Livewire\Component;

class EditTaskModal extends Component
{
    public TaskForm $form;
    public ?Task $task = null;

    public function mount(Task $task)
    {
        $this->task = $task;
        $this->form->setTask($task);
    }

    public function save()
    {
        $this->authorize('update', $this->task);

        $this->form->update();

        $this->redirectRoute('todos.index', navigate: true);
    }

    public function render()
    {
        return view('livewire.edit-task-modal');
    }
}
