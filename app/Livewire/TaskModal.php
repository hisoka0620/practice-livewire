<?php

namespace App\Livewire;

use App\Livewire\Forms\TaskForm;
use App\Models\Task;
use Livewire\Attributes\On;
use Livewire\Attributes\Url;
use Livewire\Component;

class TaskModal extends Component
{
    public TaskForm $form;
    public ?Task $task = null;
    public bool $show = false;

    #[On('open-task-modal')]
    public function open(?int $taskId = null): void
    {
        $this->resetErrorBag();
        $this->form->reset();

        if ($taskId) {
            $this->task = Task::findOrFail($taskId);
            $this->form->setTask($this->task);
        } else {
            $this->task = null;
        }

        $this->show = true;
    }

    public function save()
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
        $this->dispatch('task-modal-closed');
    }

    public function render()
    {
        return view('livewire.task-modal');
    }
}
