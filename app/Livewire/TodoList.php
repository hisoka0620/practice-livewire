<?php

namespace App\Livewire;

use App\Models\Task;
use Illuminate\Support\Facades\Auth;
use Livewire\Attributes\On;
use Livewire\Attributes\Url;
use Livewire\Component;

class TodoList extends Component
{
    #[Url(history: true, except: null)]
    public ?bool $create = null;

    #[Url(as: 'edit', except: null)]
    public ?int $editTaskId = null;

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

    public function toggleComplete($id)
    {
        $task = Task::findOrFail($id);
        $this->authorize('update', $task);
        if ($task->is_completed === 0) {
            $task->is_completed = 1;
        } else {
            $task->is_completed = 0;
        }
        $task->save();
    }

    /**
     * 編集モーダルを開くためにURLを更新します。
     */
    public function edit($id)
    {
        $this->editTaskId = $id;
        $this->create = null;
        $this->dispatch('open-task-modal', taskId: $id);
    }

    /**
     * タスクを削除します。
     */
    public function delete($id)
    {
        $task = Task::findOrFail($id);

        $this->authorize('delete', $task);

        $task->delete();
    }

    /**
     * 'task-saved' イベントをリッスンし、コンポーネントを再描画します。
     */
    #[On('task-saved')]
    public function refresh()
    {
        // This method intentionally left blank.
    }

    /**
     * モーダルが閉じたイベントをリッスンし、URLを更新します。
     */
    #[On('task-modal-closed')]
    public function closeModal()
    {
        $this->create = null;
        $this->editTaskId = null;
        $this->redirect(route('todos.index'), navigate: true);
    }

    public function render()
    {
        return view('livewire.todo-list')->with(['tasks' => Auth::user()->tasks()->latest()->get()]);
    }
}
