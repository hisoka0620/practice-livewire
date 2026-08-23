<?php

namespace App\Livewire;

use App\Models\Task;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Auth;
use Livewire\Attributes\On;
use Livewire\Attributes\Url;
use Livewire\Component;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TodoList extends Component
{
    public Collection $tasks;
    public int $overdueTasksCount = 0;

    #[Url(except: '')]
    public string $view = 'list';

    #[Url(except: '')]
    public string $priority = '';

    #[Url(except: '')]
    public string $search = '';

    #[Url(except: '', as: 'status')]
    public string $taskStatus = '';

    #[Url(except: '')]
    public string $sort = '';

    private const VIEWS = ['list', 'calendar'];

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

    /**
     * タスクの状態オプションを取得します
     */
    public function taskStatusOptions(): array
    {
        return [
            '' => 'All',
            'completed' => 'Completed',
            'incomplete' => 'Incomplete',
            'expired' => 'Expired',
        ];
    }

    /**
     * タスク取得時のベースクエリを構築
     * 検索キーワード、優先度、ステータス、ソートを適用
     *
     * @return HasMany フィルター済みタスククエリ
     */
    private function buildTaskQuery(): HasMany
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();

        return $user
            ->tasks()
            ->filterBySearch($this->search)
            ->filterByPriority($this->priority)
            ->filterByStatus($this->taskStatus)
            ->sortByDeadline($this->sort)
            ->latest();
    }

    /**
     * タスクを読み込み、カレンダーイベントを生成
     * タスク更新時に呼ばれ、フロントエンドカレンダーを更新
     */
    private function loadTasks(): void
    {
        $user = Auth::user();

        $this->tasks = $this->buildTaskQuery()->get();
        $this->overdueTasksCount = $user
            ? $user->tasks()->where('is_completed', false)->where('deadline', '<', now())->count()
            : 0;
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

    /**
     * ソート順の更新時にタスクを再読み込みします
     */
    public function updatedSort(): void
    {
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
        return in_array($view, self::VIEWS, true) ? $view : 'list';
    }

    public function changeView(string $view): void
    {
        $view = $this->normalizeView($view);

        if ($view === 'calendar') {
            $this->reset(['search', 'priority', 'sort', 'taskStatus']);
        }

        if ($view === 'list') {
            $this->js(<<<'JS'
            const url = new URL(window.location);
            url.searchParams.delete('calendarPriority');
            url.searchParams.delete('calendarTaskStatus');
            window.history.replaceState({}, '', url);
        JS);

            $this->loadTasks();
        }

        $this->view = $view;
    }

    /**
     * タスクの完了状態を切り替えます。
     */
    public function toggleComplete(int $taskId): void
    {
        $task = $this->findAndAuthorizeTask($taskId, 'update');
        $task->is_completed = !$task->is_completed;
        $task->save();
        $this->loadTasks();
    }

    /**
     * タスクを削除します。
     */
    public function delete(int $taskId): void
    {
        $task = $this->findAndAuthorizeTask($taskId, 'delete');
        $task->delete();
        $this->loadTasks();
    }

    /**
     * タスクを取得し、指定された権限を確認します。
     */
    private function findAndAuthorizeTask(int $taskId, string $ability): Task
    {
        $task = Task::findOrFail($taskId);
        $this->authorize($ability, $task);
        return $task;
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
