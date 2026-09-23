<?php

use App\Models\Task;
use App\Presenters\TaskPresenter;
use Illuminate\Support\Carbon;
use Tests\TestCase;

uses(TestCase::class);

afterEach(function () {
  Carbon::setTestNow();
});

it('prepares highlighted task content and visual state', function () {
  Carbon::setTestNow('2026-09-23 12:00:00');

  $task = new Task([
    'title' => 'Prepare report',
    'description' => 'Review the report',
    'priority' => 'high',
    'is_completed' => false,
    'deadline' => '2026-09-23 18:30:00',
  ]);

  $presenter = new TaskPresenter($task, 'report');

  expect($presenter->title())->toContain('<mark')->toContain('report')
    ->and($presenter->description())->toContain('<mark')
    ->and($presenter->priorityLabel())->toBe('High')
    ->and($presenter->visualStatus())->toBe('due_soon')
    ->and($presenter->deadlineLabel())->toBe('2026-09-23 18:30')
    ->and($presenter->deadlineHumanDiff())->not->toBeNull()
    ->and($presenter->badge())->toBe(['label' => 'Due soon', 'color' => 'yellow']);
});

it('returns completed row and badge presentation', function () {
  $task = new Task([
    'priority' => 'low',
    'is_completed' => true,
  ]);

  $presenter = new TaskPresenter($task);

  expect($presenter->visualStatus())->toBe('completed')
    ->and($presenter->rowClasses())->toHaveKey('opacity-75', true)
    ->and($presenter->badge())->toBe(['label' => 'Completed', 'color' => 'green'])
    ->and($presenter->deadlineHumanDiff())->toBeNull();
});
