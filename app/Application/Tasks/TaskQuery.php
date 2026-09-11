<?php

namespace App\Application\Tasks;

use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Application\Tasks\TaskFilters;
use Illuminate\Support\Carbon;

final class TaskQuery
{
    public function forUser(
        User $user,
        string $search = '',
        string $priority = '',
        string $status = '',
        string $sort = '',
    ): HasMany {
        return $user->tasks()
            ->filterBySearch($search)
            ->filterByPriority($priority)
            ->filterByStatus($status)
            ->sortByDeadline($sort)
            ->latest();
    }

    public function forCalendar(
        User $user,
        string $priority = '',
        string $status = '',
    ): HasMany {
        return $user->tasks()
            ->filterByPriority($priority)
            ->filterByStatus($status)
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
