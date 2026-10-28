<?php

use App\Application\Tasks\TaskFilters;
use App\Enums\TaskPriority;
use App\Enums\TaskSort;
use App\Enums\TaskStatusFilter;

it('converts Livewire values into enums', function () {
    $filters = TaskFilters::fromLivewire(
        search: 'meeting',
        priority: 'high',
        taskStatus: 'incomplete',
        sort: 'asc',
    );

    expect($filters->search)->toBe('meeting')
        ->and($filters->priority)->toBe(TaskPriority::High)
        ->and($filters->status)->toBe(TaskStatusFilter::Incomplete)
        ->and($filters->sort)->toBe(TaskSort::Asc);
});

it('falls back to default values for invalid input', function () {
    $filters = TaskFilters::fromLivewire(
        search: '',
        priority: 'invalid',
        taskStatus: 'invalid',
        sort: 'invalid',
    );

    expect($filters->priority)->toBe(TaskPriority::All)
        ->and($filters->status)->toBe(TaskStatusFilter::All)
        ->and($filters->sort)->toBe(TaskSort::None);
});
