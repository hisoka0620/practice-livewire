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

    /**
     * コンポーネントの初期化時にタスクを読み込みます
     */
    public function mount(): void
    {
        $this->loadTasks();
    }

    /**
     * タスクを取得するメソッド
     */
    private function loadTasks(): void
    {
        $query = Auth::user()
            ->tasks()
            ->when(
                $this->priority,
                fn($query) => $query->where('priority', $this->priority)
            )
            ->latest();

        $this->tasks = $query->get();
    }

    /**
     * 優先度の更新時にフィルター状態を更新します
     */
    public function updatedPriority(string $value): void
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
