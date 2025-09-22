<?php

namespace App\Livewire\Forms;

use Livewire\Attributes\Validate;
use Livewire\Form;

class TaskForm extends Form
{
    #[Validate('required|string|max:255|regex:/[^\s　]/u')]
    public $title;

    #[Validate('required|string|max:255|regex:/[^\s　]/u')]
    public $description;
}
