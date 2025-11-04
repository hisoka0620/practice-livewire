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

    #[Url(history: true, except: null)]
    public ?bool $create = null;

    #[Url(as: 'edit', except: null)]
    public ?int $editTaskId = null;

    #[Url(as: 'filtered', except: false)]
    public bool $isFiltered  = false;

    #[Url(except: '')]
    public string $priority = '';

    public function mount(): void
    {
        $this->loadTasks();
    }

    public function updatedPriority(string $value): void
    {
        $this->isFiltered = $value !== '';
        $this->loadTasks();
    }

    /**
     * タスクを取得するメソッド
     */
    private function loadTasks(): void
    {
        $query = Auth::user()
            ->tasks()
            ->when($this->isFiltered && $this->priority, function ($query) {
                $query->where('priority', $this->priority);
            })
            ->latest();

        $this->tasks = $query->get();
    }

    /**
     * 新規作成モーダルを開くためにURLを更新します。
     * メソッド名はプロパティと競合するため変更しています。
     */
    public function openCreateModal(): void
    {
        $this->create = true;
        $this->editTaskId = null;
        $this->dispatch('open-task-modal');
    }

    /**
     * タスクの完了状態を切り替えます。
     */
    public function toggleComplete(int $id): void
    {
        $task = Task::findOrFail($id);
        $this->authorize('update', $task);
        $task->is_completed = !$task->is_completed;
        $task->save();
    }

    /**
     * 編集モーダルを開くためにURLを更新します。
     */
    public function edit($id): void
    {
        $this->editTaskId = $id;
        $this->create = null;
        $this->dispatch('open-task-modal', taskId: $id);
    }

    /**
     * タスクを削除します。
     */
    public function delete($id): void
    {
        $task = Task::findOrFail($id);
        $this->authorize('delete', $task);
        $task->delete();
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

    /**
     * モーダルが閉じたイベントをリッスンし、URLを更新します。
     */
    #[On('task-modal-closed')]
    public function closeModal()
    {
        $queryParams = [];

        // フィルタリング状態がある場合のみパラメータを追加
        if ($this->priority !== '' && $this->filtered) {
            $queryParams['priority'] = $this->priority;
            $queryParams['filtered'] = true;
        }

        $this->reset(['create', 'editTaskId']);

        $this->redirect(
            route('todos.index', $queryParams),
            navigate: true
        );
    }

    public function render()
    {
        return view('livewire.todo-list', [
            'tasks' => $this->tasks
        ]);
    }
}
