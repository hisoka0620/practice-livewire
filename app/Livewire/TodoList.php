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
    private const ON = 1;
    private const OFF = 0;

    public Collection $tasks;

    #[Url(as: 'create', history: true, except: 0)]
    public ?int $createTask = self::OFF;

    #[Url(as: 'edit', except: null)]
    public ?int $editTaskId = null;

    #[Url(as: 'filtered', except: 0)]
    public int $isFiltered  = self::OFF;

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
     * 優先度の更新時にフィルター状態を更新します
     */
    public function updatedPriority(string $value): void
    {
        $this->isFiltered = $this->shouldBeFiltered($value)
            ? self::ON
            : self::OFF;
            
        $this->loadTasks();
    }

    /**
     * フィルタリングが必要かどうかを判定します
     */
    private function shouldBeFiltered(string $value): bool
    {
        return $value !== '';
    }

    /**
     * タスクを取得するメソッド
     */
    private function loadTasks(): void
    {
        $query = Auth::user()
            ->tasks()
            ->when(
                $this->isFiltered === self::ON && $this->priority,
                fn($query) => $query->where('priority', $this->priority)
            )
            ->latest();

        $this->tasks = $query->get();
    }

    /**
     * 新規作成モーダルを開くためにURLを更新します。
     * メソッド名はプロパティと競合するため変更しています。
     */
    public function create(): void
    {
        $this->createTask = self::ON;
        $this->editTaskId = null;
        $this->dispatch('open-task-modal');
    }

    /**
     * タスクの完了状態を切り替えます。
     */
    public function toggleComplete(int $taskId): void
    {
        $task = $this->findAndAuthorizeTask($taskId, 'update');
        $task->is_completed = !$task->is_completed;
        $task->save();
    }

    /**
     * 編集モーダルを開くためにURLを更新します。
     */
    public function edit(int $taskId): void
    {
        $this->editTaskId = $taskId;
        $this->createTask = self::OFF;
        $this->dispatch('open-task-modal', taskId: $taskId);
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

    /**
     * モーダルが閉じたイベントをリッスンし、URLを更新します。
     */
    #[On('task-modal-closed')]
    public function closeModal(): void
    {
        $queryParams = $this->buildQueryParams();
        $this->reset(['createTask', 'editTaskId']);
        $this->redirect(
            route('todos.index', $queryParams),
            navigate: true
        );
    }

    /**
     * URLクエリパラメータを構築します
     */
    private function buildQueryParams(): array
    {
        if ($this->priority === '' || $this->isFiltered === self::OFF) {
            return [];
        }
        return [
            'filtered' => self::ON,
            'priority' => $this->priority,
        ];
    }
    public function render()
    {
        return view('livewire.todo-list', [
            'tasks' => $this->tasks
        ]);
    }
}
