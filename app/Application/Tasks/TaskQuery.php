<?php

namespace App\Application\Tasks;

use App\Models\User;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

final class TaskQuery
{
    public function forUser(
        User $user,
        TaskFilters $filters,
    ): HasMany {
        return $user->tasks()
            ->filterBySearch($filters->search)
            ->filterByPriority($filters->priority->value)
            ->filterByStatus($filters->status->value)
            ->sortByDeadline($filters->sort->value)
            ->latest();
    }

    public function forCalendar(
        User $user,
        TaskFilters $filters,
    ): HasMany {
        return $user->tasks()
            ->filterBySearch($filters->search)
            ->filterByPriority($filters->priority->value)
            ->filterByStatus($filters->status->value)
            ->latest();
    }

    public function overdueCount(User $user): int
    {
        return $user->tasks()
            ->where('is_completed', false)
            ->where('deadline', '<', now())
            ->count();
    }

    public function withinPeriod(
        HasMany $query,
        Carbon $start,
        Carbon $end,
    ): HasMany {
        return $query
            ->where('deadline', '>=', $start)
            ->where('deadline', '<', $end);
    }
}
