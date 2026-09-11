<?php

namespace App\Application\Tasks;

use App\Models\Task;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Gate;

final class TaskActions
{
    public function toggleCompletion(User $user, int $taskId): Task
    {
        $task = $user->tasks()->findOrFail($taskId);

        Gate::forUser($user)->authorize('update', $task);

        $task->update([
            'is_completed' => !$task->is_completed,
        ]);

        return $task->refresh();
    }
    public function delete(User $user, int $taskId): void
    {
        $task = $user->tasks()->findOrFail($taskId);

        Gate::forUser($user)->authorize('delete', $task);

        $task->delete();
    }
    public function updateDeadline(User $user, int $taskId, Carbon $deadline): Task
    {
        $task = $user->tasks()->findOrFail($taskId);

        Gate::forUser($user)->authorize('update', $task);

        $task->update([
            'deadline' => $deadline,
        ]);

        return $task->refresh();
    }
}
