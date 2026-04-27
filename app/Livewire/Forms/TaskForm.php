<?php

namespace App\Livewire\Forms;

use Livewire\Attributes\Validate;
use Livewire\Form;
use App\Models\Task;

class TaskForm extends Form
{
    public ?Task $task;

    #[Validate('required|string|max:100|regex:/[^\s　]/u')]
    public $title;

    #[Validate('string|max:255|nullable')]
    public $description;

    #[Validate('required|in:low,medium,high')]
    public string $priority = 'medium';

    #[Validate('nullable|date')]
    public ?string $deadline;

    private const array TASK_FIELDS = ['title', 'description', 'priority', 'deadline'];

    public function setTask(Task $task): void
    {
        $this->task = $task;
        $this->title = $task->title;
        $this->priority = $task->priority;
        $this->description = $task->description;
        $this->deadline = $task->deadline?->format('Y-m-d\TH:i');
    }

    public function create(): void
    {
        $this->validate();

        /** @var \App\Models\User $user */
        $user = auth('web')->user();
        $user->tasks()->create($this->pull(self::TASK_FIELDS));
    }

    public function update(): void
    {
        $this->validate();

        $data = $this->pull(self::TASK_FIELDS);

        $this->task->fill($data);

        if ($this->task->isDirty('deadline')) {
            $this->task->deadline_notified_at = null;
        }

        $this->task->save();
    }
}
