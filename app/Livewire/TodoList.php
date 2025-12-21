<?php

namespace App\Livewire;

use App\Models\Task;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Auth;
use Livewire\Attributes\On;
use Livewire\Attributes\Url;
use Livewire\Component;

class TodoList extends Component
{
    public Collection $tasks;

    #[Url(except: '')]
    public string $priority = '';

    #[Url(except: '')]
    public string $search = '';

    /**
     * コンポーネントの初期化時にタスクを読み込みます
     */
    public function mount(): void
    {
        $this->loadTasks();
    }

    public function highlight(string $text): string
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
     * タスクのベースクエリを構築
     */
    private function buildTaskQuery()
    {
        return Auth::user()
            ->tasks()
            ->when(
                $this->priority,
                fn($query) => $query->where('priority', $this->priority)
            )
            ->when(
                filled(mb_convert_kana($this->search, 's')),
                fn($query) => $query->whereAny(
                    ['title', 'description', 'priority'],
                    'like',
                    '%' . trim(mb_convert_kana($this->search, 's')) . '%'
                )
            )
            ->latest();
    }

    /**
     * タスク取得メソッド
     */
    private function loadTasks(): void
    {
        $this->tasks = $this->buildTaskQuery()->get();
    }

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
