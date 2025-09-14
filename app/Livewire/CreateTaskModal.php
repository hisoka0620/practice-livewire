<?php

namespace App\Livewire;

use Livewire\Component;
use Illuminate\Support\Facades\Auth;
use App\Models\Task;

class CreateTaskModal extends Component
{

    public $title;
    public $description;

    public function mount(){
        logger('Auth User: ' . Auth::user());
    }

    public function save(){
        $validated = $this->validate([
            'title' => 'required|string|max:255|regex:/[^\s　]/u',
            'description' => 'nullable|string|regex:/[^\s　]/u',
        ]);

        $validated['user_id'] = Auth::id();

        Task::create($validated);

        return redirect()->route('todos.index');
    }

    public function render()
    {
        return view('livewire.create-task-modal');
    }
}
