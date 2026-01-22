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
     * タスクのベースクエリを構築
     */
    private function buildTaskQuery(): hasMany
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
     * タスク取得メソッド
     */
    private function loadTasks(): void
    {
        $this->tasks = $this->buildTaskQuery()->get();
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
     * 完了状態の更新時にフィルター状態を更新します
     */
    public function updatedTaskStatus(): void
    {
        $this->loadTasks();
    }

    public function updatedSort(): void
    {
        $this->loadTasks();
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
