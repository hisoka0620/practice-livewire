<?php

namespace App\Livewire\Forms;

use Livewire\Attributes\Validate;
use Livewire\Form;
use App\Models\Task;

class TaskForm extends Form
{
    public ?Task $task = null;

    #[Validate('required|string|max:255|regex:/[^\s　]/u')]
    public $title;

    #[Validate('required|string|max:255|regex:/[^\s　]/u')]
    public $description;

    public function setTask(Task $task)
    {
        $this->task = $task;
        $this->title = $task->title;
        $this->description = $task->description;
    }

    public function create()
    {
        $this->validate();

        auth()->user()->tasks()->create($this->all());
    }

    public function update()
    {
        $this->validate();

        $this->task->update($this->all());
    }
}
