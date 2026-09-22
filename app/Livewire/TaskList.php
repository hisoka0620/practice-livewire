<?php

namespace App\Livewire;

use App\Application\Tasks\TaskActions;
use App\Application\Tasks\TaskFilters;
use App\Application\Tasks\TaskQuery;
use App\Enums\TaskSort;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Auth;
use Livewire\Attributes\Modelable;
use Livewire\Attributes\On;
use Livewire\Component;

class TaskList extends Component
{
    public Collection $tasks;

    #[Modelable]
    public array $filters = [
        'search' => '',
        'priority' => '',
        'taskStatus' => '',
    ];

    public string $sort = '';

    public function mount(): void
    {
        $this->loadTasks();
    }

    public function updatedFilters(): void
    {
        $this->loadTasks();
    }

    private function currentFilters(): TaskFilters
    {
        return TaskFilters::fromLivewire(
            search: $this->filters['search'] ?? '',
            priority: $this->filters['priority'] ?? '',
            taskStatus: $this->filters['taskStatus'] ?? '',
            sort: $this->sort,
        );
    }

    private function loadTasks(): void
    {
        $this->tasks = app(TaskQuery::class)
            ->forUser(Auth::user(), $this->currentFilters())
            ->get();
    }

    /**
     * テキスト内の検索キーワードをハイライト表示します
     */
    public function highlight(?string $text): string
    {
        $search = $this->filters['search'] ?? '';

        if (blank(mb_convert_kana($search, 's'))) {
            return e($text);
        }

        $words = preg_split('/[\s　]+/u', trim($search), -1, PREG_SPLIT_NO_EMPTY);

        $escapedText = e($text);

        $keyword = implode('|', array_map(fn(string $word) => preg_quote($word, '/'), $words));

        $highlighted = preg_replace(
            '/' . $keyword . '/iu',
            '<mark class="bg-yellow-200 text-yellow-900 rounded-sm px-0.5">$0</mark>',
            $escapedText
        );

        return $highlighted;
    }

    public function nextSort(): void
    {
        $currentSort = TaskSort::tryFrom($this->sort)
            ?? TaskSort::None;

        $this->sort = $currentSort->next()->value;

        $this->loadTasks();

        $this->dispatch('sort-changed', sort: $this->sort)->to(TodoList::class);
    }

    public function toggleComplete(int $taskId): void
    {
        app(TaskActions::class)->toggleCompletion(Auth::user(), $taskId);

        $this->loadTasks();
        $this->dispatch('task-list-updated')->to(TodoList::class);
    }

    public function delete(int $taskId): void
    {
        app(TaskActions::class)->delete(Auth::user(), $taskId);

        $this->loadTasks();
        $this->dispatch('task-list-updated')->to(TodoList::class);
    }

    #[On('task-saved')]
    public function refresh(): void
    {
        $this->loadTasks();
    }

    public function render()
    {
        return view('livewire.task-list');
    }
}
