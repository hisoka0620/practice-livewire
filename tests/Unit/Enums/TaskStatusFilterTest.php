<?php

use App\Enums\TaskStatusFilter;

it('provides status filter options', function () {
    expect(TaskStatusFilter::options())->toBe([
        '' => 'All',
        'completed' => 'Completed',
        'incomplete' => 'Incomplete',
        'expired' => 'Expired',
    ]);
});
