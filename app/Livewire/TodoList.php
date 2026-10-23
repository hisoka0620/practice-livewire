<?php

namespace App\Livewire;

use App\Application\Tasks\TaskQuery;
use App\Enums\TaskView;
use Illuminate\Support\Facades\Auth;
use Livewire\Attributes\On;
use Livewire\Attributes\Url;
use Livewire\Component;

class TodoList extends Component
{
    public int $overdueTasksCount = 0;

    #[Url(except: 'list')]
    public string $view = 'list';

    #[Url(except: '')]
    public string $search = '';

    #[Url(except: '')]
    public string $priority = '';

    #[Url(as: 'status', except: '')]
    public string $taskStatus = '';

    public array $filters = [
        'search' => '',
        'priority' => '',
        'taskStatus' => '',
    ];

    #[Url(except: '')]
    public string $sort = '';

    /**
     * Load tasks when the component is initialized
     */
    public function mount(): void
    {
        $this->syncFiltersFromURL();
        $this->view = $this->normalizeView($this->view);
        $this->loadOverdueTasksCount();
    }

    private function syncFiltersFromURL(): void
    {
        $this->filters = [
            'search' => $this->search,
            'priority' => $this->priority,
            'taskStatus' => $this->taskStatus,
        ];
    }

    private function applyFiltersToURL(): void
    {
        $this->search = $this->filters['search'] ?? '';
        $this->priority = $this->filters['priority'] ?? '';
        $this->taskStatus = $this->filters['taskStatus'] ?? '';

    }

    private function loadOverdueTasksCount(): void
    {
        $this->overdueTasksCount = app(TaskQuery::class)
            ->overdueCount(Auth::user());
    }

    #[On('task-list-updated')]
    public function refreshOverdueTasksCount(): void
    {
        $this->loadOverdueTasksCount();
    }

    #[On('sort-changed')]
    public function applySortToURL(string $sort): void
    {
        $this->sort = $sort;
    }

    /**
     * Runs when filters.priority, filters.taskStatus,
     * or filters.search changes.
     */
    public function updatedFilters(mixed $value, ?string $key = null): void
    {
        $this->applyFiltersToURL();
    }

    /**
     * When the URL parameter is changed by external operations
     */
    public function updatedSearch(): void
    {
        $this->filters['search'] = $this->search;
    }

    public function updatedPriority(): void
    {
        $this->filters['priority'] = $this->priority;
    }

    public function updatedTaskStatus(): void
    {
        $this->filters['taskStatus'] = $this->taskStatus;
    }

    public function openCreateTaskModal(): void
    {
        $this->dispatch('open-task-modal')->to(TaskModal::class);
    }

    private function normalizeView(string $view): string
    {
        return TaskView::tryFrom($view)?->value
            ?? TaskView::List->value;
    }

    public function changeView(string $view): void
    {
        $view = $this->normalizeView($view);
        $this->view = $view;
    }

    /**
     * Refresh after a task is saved
     */
    #[On('task-saved')]
    public function refresh(): void
    {
        $this->loadOverdueTasksCount();
    }

    public function render()
    {
        return view('livewire.todo-list');
    }
}
