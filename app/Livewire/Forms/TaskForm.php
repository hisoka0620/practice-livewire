<?php

namespace App\Livewire\Forms;

use App\Models\Task;
use Illuminate\Support\Carbon;
use Livewire\Attributes\Validate;
use Livewire\Form;

class TaskForm extends Form
{
    public ?Task $task;

    #[Validate('required|string|max:100|regex:/[^\s　]/u')]
    public $title;

    #[Validate('string|max:255|nullable')]
    public $description;

    #[Validate('required|in:low,medium,high')]
    public string $priority = 'medium';

    #[Validate('nullable|date_format:Y-m-d\TH:i:s.v\Z')]
    public ?string $deadline = null;

    private const TASK_FIELDS = ['title', 'description', 'priority', 'deadline'];

    public function setTask(Task $task): void
    {
        $this->task = $task;
        $this->title = $task->title;
        $this->priority = $task->priority;
        $this->description = $task->description;
        $this->deadline = $task->deadline?->utc()->format('Y-m-d\TH:i:s.v\Z');
    }

    public function setDeadlineDate(string $prefillDeadline): void
    {
        $this->deadline = $prefillDeadline;
    }

    public function create(): void
    {
        $this->validate();

        $data = $this->pull(self::TASK_FIELDS);
        $data['deadline'] = $this->deadlineForPersistence($data['deadline']);

        /** @var \App\Models\User $user */
        $user = auth('web')->user();
        $user->tasks()->create($data);
    }

    public function update(): void
    {
        $this->validate();

        $data = $this->pull(self::TASK_FIELDS);
        $data['deadline'] = $this->deadlineForPersistence($data['deadline']);

        $this->task->fill($data);

        if ($this->task->isDirty('deadline')) {
            $this->task->deadline_notified_at = null;
        }

        $this->task->save();
    }

    private function deadlineForPersistence(?string $deadline): ?Carbon
    {
        return blank($deadline)
            ? null
            : Carbon::parse($deadline)->setTimezone(config('app.timezone'));
    }
}
