<?php

namespace App\Application\Tasks;

use App\Enums\TaskPriority;
use App\Enums\TaskSort;
use App\Enums\TaskStatusFilter;

final readonly class TaskFilters
{
    public function __construct(
        public string $search = '',
        public TaskPriority $priority = TaskPriority::All,
        public TaskStatusFilter $status = TaskStatusFilter::All,
        public TaskSort $sort = TaskSort::None,
    ) {
    }

    public static function fromLivewire(
        string $search,
        string $priority,
        string $taskStatus,
        string $sort,
    ): self {
        return new self(
            search: $search,
            priority: TaskPriority::tryFrom($priority)
            ?? TaskPriority::All,
            status: TaskStatusFilter::tryFrom($taskStatus)
            ?? TaskStatusFilter::All,
            sort: TaskSort::tryFrom($sort)
            ?? TaskSort::None,
        );
    }
}
