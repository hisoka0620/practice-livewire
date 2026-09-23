<?php

namespace App\Presenters;

use App\Models\Task;
use App\Support\SearchHighlighter;

final class TaskPresenter
{
    public function __construct(
        public readonly Task $task,
        public readonly string $search = '',
    ) {
    }

    public function title(): string
    {
        return app(SearchHighlighter::class)->highlight($this->task->title, $this->search);
    }

    public function description(): string
    {
        return app(SearchHighlighter::class)->highlight($this->task->description, $this->search);
    }

    public function visualStatus(): string
    {
        return $this->task->visual_status;
    }

    public function priorityLabel(): string
    {
        return ucfirst($this->task->priority);
    }

    /**
     * @return array<string, bool|string>
     */
    public function rowClasses(): array
    {
        return [
            'rounded-md border bg-zinc-800 px-4 py-3 transition hover:bg-zinc-700',
            'border-red-400/40 bg-red-950/10' => $this->visualStatus() === 'overdue',
            'border-yellow-400/40' => $this->visualStatus() === 'due_soon',
            'opacity-75' => $this->visualStatus() === 'completed',
        ];
    }

    /**
     * @return array<string, bool|string>
     */
    public function deadlineClasses(): array
    {
        return [
            'text-zinc-300',
            'text-red-300! font-semibold tracking-wide' => $this->visualStatus() === 'overdue',
            'text-yellow-300! font-semibold tracking-wide' => $this->visualStatus() === 'due_soon',
        ];
    }

    public function deadlineLabel(): string
    {
        return $this->task->deadline?->format('Y-m-d H:i') ?? 'No deadline';
    }

    public function deadlineHumanDiff(): ?string
    {
        return in_array($this->visualStatus(), ['overdue', 'due_soon'], true)
            ? $this->task->deadline_human_diff
            : null;
    }

    /**
     * @return array{label: string, color: string}|null
     */
    public function badge(): ?array
    {
        return match ($this->visualStatus()) {
            'overdue' => ['label' => 'Overdue', 'color' => 'red'],
            'due_soon' => ['label' => 'Due soon', 'color' => 'yellow'],
            'completed' => ['label' => 'Completed', 'color' => 'green'],
            default => null,
        };
    }
}
