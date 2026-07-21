<?php

namespace App\Livewire;

use App\Livewire\Forms\TaskForm;
use App\Models\Task;
use Livewire\Attributes\On;
use Livewire\Component;
use Livewire\Attributes\Url;
use Carbon\Carbon;

class TaskModal extends Component
{
    public TaskForm $form;
    public ?Task $task = null;
    public bool $show = false;

    #[Url(as: 'create', except: 0)]
    public int $createTask = 0;

    #[Url(as: 'edit', except: 0)]
    public int $editTaskId = 0;

    public function mount(): void
    {
        if ($this->editTaskId) {
            $this->open($this->editTaskId);
        } elseif ($this->createTask === 1) {
            $this->open();
        }
    }

    #[On('open-task-modal')]
    public function open(?int $taskId = null, ?string $prefillDeadline = null): void
    {
        $this->resetErrorBag();
        $this->form->reset();
        $this->reset(['task', 'editTaskId', 'createTask']);

        if ($taskId) {
            $this->task = Task::findOrFail($taskId);
            $this->form->setTask($this->task);
            $this->editTaskId = $taskId;
        } else if ($prefillDeadline) {
            $this->form->setDeadlineDate(Carbon::parse($prefillDeadline)->format('Y-m-d\TH:i'));
            $this->createTask = 1;
        } else {
            $this->createTask = 1;
        }

        $this->show = true;
    }

    public function save(): void
    {
        $this->task ? $this->updateTask() : $this->createTask();
        $this->dispatch('task-saved');
        $this->close();
    }

    private function createTask(): void
    {
        $this->authorize('create', Task::class);
        $this->form->create();
    }

    private function updateTask(): void
    {
        $this->authorize('update', $this->task);
        $this->form->update();
    }

    public function close(): void
    {
        $this->reset();
    }

    public function render()
    {
        return view('livewire.task-modal');
    }
}
