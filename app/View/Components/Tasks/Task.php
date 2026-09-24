<?php

namespace App\View\Components\Tasks;

use App\Models\Task as TaskModel;
use App\Presenters\TaskPresenter;
use Illuminate\Contracts\View\View;
use Illuminate\View\Component;

final class Task extends Component
{
  public readonly TaskPresenter $presenter;

  public function __construct(
    public readonly TaskModel $task,
    public readonly string $search = '',
  ) {
    $this->presenter = new TaskPresenter($task, $search);
  }

  public function render(): View
  {
    return view('components.tasks.task');
  }
}
