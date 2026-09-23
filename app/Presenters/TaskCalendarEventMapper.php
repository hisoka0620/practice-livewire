<?php

namespace App\Presenters;

use App\Models\Task;

final class TaskCalendarEventMapper
{
    public function map(Task $task): array
    {
        $status = str_replace('_', ' ', $task->visual_status);

        return [
            'id' => (string) $task->id,
            'title' => $task->title,
            'start' => $task->deadline?->format('Y-m-d\TH:i:s'),
            'end' => null,
            'color' => $this->color($task),
            'extendedProps' => [
                'status' => $status,
                'priority' => $task->priority,
                'deadline' => $task->deadline?->format('Y-m-d\TH:i:s'),
                'isOverdue' => $status === 'overdue',
                'completed' => $task->is_completed,
            ],
        ];
    }

    private function color(Task $task): string
    {
        if ($task->is_completed) {
            return '#9CA3AF';
        }

        return match ($task->deadline_status) {
            'overdue' => '#991B1B',
            'due_soon' => '#D97706',
            default => '#0369A1',
        };
    }
}
