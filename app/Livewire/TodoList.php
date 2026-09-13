<?php

namespace App\Livewire;

use App\Models\Task;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Auth;
use Livewire\Attributes\On;
use Livewire\Attributes\Url;
use Livewire\Component;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Application\Tasks\TaskActions;
use App\Application\Tasks\TaskQuery;
use App\Application\Tasks\TaskFilters;
use App\Enums\TaskPriority;
use App\Enums\TaskSort;
use App\Enums\TaskStatusFilter;
use App\Enums\TaskView;

class TodoList extends Component
{
    public Collection $tasks;
    public int $overdueTasksCount = 0;

    #[Url(except: 'list')]
    public string $view = 'list';

    #[Url(except: '')]
    public string $priority = '';

    #[Url(except: '')]
    public string $search = '';

    #[Url(except: '', as: 'status')]
    public string $taskStatus = '';

    #[Url(except: '')]
    public string $sort = '';

    /**
     * コンポーネントの初期化時にタスクを読み込みます
     */
    public function mount(): void
    {
        $this->view = $this->normalizeView($this->view);
        $this->loadTasks();
    }

    /**
     * テキスト内の検索キーワードをハイライト表示します
     */
    public function highlight(?string $text): string
    {
        if (blank(mb_convert_kana($this->search, 's'))) {
            return e($text);
        }

        $words = preg_split('/[\s　]+/u', trim($this->search), -1, PREG_SPLIT_NO_EMPTY);

        $escapedText = e($text);

        $keyword = implode('|', array_map(fn($word) => preg_quote($word, '/'), $words));

        $highlighted = preg_replace(
            '/' . e($keyword) . '/iu',
            '<mark class="bg-yellow-200 text-yellow-900 rounded-sm px-0.5">$0</mark>',
            $escapedText
        );

        return $highlighted;
    }

    public function priorityOptions(): array
    {
        return TaskPriority::options();
    }

    /**
     * タスクの状態オプションを取得します
     */
    public function taskStatusOptions(): array
    {
        return TaskStatusFilter::options();
    }

    private function filters(): TaskFilters
    {
        return TaskFilters::fromLivewire(
            search: $this->search,
            priority: $this->priority,
            taskStatus: $this->taskStatus,
            sort: $this->sort,
        );
    }

    private function loadTasks(): void
    {
        $user = Auth::user();

        $taskQuery = app(TaskQuery::class);

        $this->tasks = $taskQuery
            ->forUser($user, $this->filters())
            ->get();

        $this->overdueTasksCount = $taskQuery->overdueCount($user);
    }

    /**
     * 検索キーワードの更新時にフィルター状態を更新します
     */
    public function updatedSearch(): void
    {
        $this->loadTasks();
    }

    /**
     * 優先度の更新時にフィルター状態を更新します
     */
    public function updatedPriority(): void
    {
        $this->loadTasks();
    }

    public function nextSort(): void
    {
        $currentSort = TaskSort::tryFrom($this->sort)
            ?? TaskSort::None;

        $this->sort = $currentSort->next()->value;

        $this->loadTasks();
    }

    #[On('calendar-filters-update')]
    public function applyCalendarFiltersState(
        string $priority = '',
        string $taskStatus = ''
    ): void {
        $this->priority = $priority;
        $this->taskStatus = $taskStatus;
        $this->loadTasks();
    }

    #[On('calendar-filters-clear')]
    public function clearCalendarFiltersState(): void
    {
        $this->reset(['priority', 'taskStatus']);
        $this->loadTasks();
    }

    /**
     * タスク状態の更新時にタスクを再読み込みします
     */
    public function changeTaskStatus(string $status): void
    {
        $this->taskStatus = $status;
        $this->loadTasks();
    }

    public function openCreateTaskModal(): void
    {
        $this->dispatch('open-task-modal')->to(TaskModal::class);
    }

    private function normalizeView(string $view): string
    {
        return TaskView::tryFrom($view)?->value
            ?? TaskView::List ->value;
    }

    public function changeView(string $view): void
    {
        $view = $this->normalizeView($view);

        $this->view = $view;

        $this->loadTasks();
    }

    public function toggleComplete(int $taskId): void
    {
        app(TaskActions::class)->toggleCompletion(
            Auth::user(),
            $taskId,
        );

        $this->loadTasks();
    }

    public function delete(int $taskId): void
    {
        app(TaskActions::class)->delete(
            Auth::user(),
            $taskId,
        );

        $this->loadTasks();
    }

    /**
     * タスク保存後の更新処理
     */
    #[On('task-saved')]
    public function refresh(): void
    {
        $this->loadTasks();
    }

    public function render()
    {
        return view('livewire.todo-list')->with([
            'tasks' => $this->tasks
        ]);
    }
}
