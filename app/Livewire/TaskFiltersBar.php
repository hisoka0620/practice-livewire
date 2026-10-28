<?php

namespace App\Livewire;

use App\Enums\TaskPriority;
use App\Enums\TaskStatusFilter;
use Livewire\Attributes\Modelable;
use Livewire\Component;

class TaskFiltersBar extends Component
{
    public bool $showFilters = true;

    #[Modelable]
    public array $filters = [
        'search' => '',
        'priority' => '',
        'taskStatus' => '',
    ];

    public function priorityOptions(): array
    {
        return TaskPriority::options();
    }

    public function taskStatusOptions(): array
    {
        return TaskStatusFilter::options();
    }

    public function render()
    {
        return view('livewire.task-filters-bar');
    }
}
