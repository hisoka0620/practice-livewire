<?php

namespace App\Livewire;

use Livewire\Component;
use Illuminate\Support\Facades\Auth;
use App\Livewire\Forms\TaskForm;

class EditTaskModal extends Component
{
    public TaskForm $form;
    public $task;

    public function mount($taskId)
    {
        $this->task = Auth::user()->tasks()->findOrFail($taskId);
        $this->form->title = $this->task->title;
        $this->form->description = $this->task->description;
    }

    public function save(){
        $this->validate();

        $this->task->update($this->form->all());

        $this->redirectRoute('todos.index', navigate: true);
    }

    public function render()
    {
        return view('livewire.edit-task-modal');
    }
}
