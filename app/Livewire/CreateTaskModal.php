<?php

namespace App\Livewire;

use Livewire\Component;
use Illuminate\Support\Facades\Auth;
use App\Livewire\Forms\TaskForm;

class CreateTaskModal extends Component
{
    public TaskForm $form;

    public function create()
    {
        $this->validate();

        Auth::user()->tasks()->create($this->form->all());

        return $this->redirectRoute('todos.index', navigate: true);
    }

    public function render()
    {
        return view('livewire.create-task-modal');
    }
}
