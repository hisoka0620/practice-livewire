<div @class([
    'rounded-md border bg-zinc-800 px-4 py-3 transition hover:bg-zinc-700',
    'border-red-400/40 bg-red-950/10' => $task->deadline_status === 'overdue',
    'border-yellow-400/40' => $task->deadline_status === 'due_soon',
    'opacity-75' => $task->is_completed,
])>
    <div class="grid grid-cols-5 items-center gap-2 text-sm">

        {{-- Title --}}
        <div class="line-clamp-2 font-medium">
            {!! $this->highlight($task->title) !!}
        </div>

        {{-- Description --}}
        <div class="line-clamp-2 text-zinc-400">
            {!! $this->highlight($task->description) !!}
        </div>

        {{-- Priority --}}
        <div class="flex justify-center">
            <span class="rounded-md bg-zinc-700 px-2 py-1 text-xs font-semibold">
                {{ ucfirst($task->priority) }}
            </span>
        </div>

        {{-- Deadline / Status --}}
        <div class="flex flex-col items-center gap-1">
            <span @class([
                'text-zinc-300',
                'text-red-300! font-semibold tracking-wide' =>
                    $task->deadline_status === 'overdue',
                'text-yellow-300! font-semibold tracking-wide' =>
                    $task->deadline_status === 'due_soon',
            ])>
                {{ $task->deadline?->format('Y-m-d H:i') ?? 'No deadline' }}
                @if ($task->deadline_status === 'overdue' || $task->deadline_status === 'due_soon')
                    <span class="ml-1 text-xs font-medium">
                        ({{ $task->deadline_human_diff }})
                    </span>
                @endif
            </span>

            @if ($task->deadline_status === 'overdue')
                <flux:badge size="sm" variant="subtle" color="red">
                    Overdue
                </flux:badge>
            @elseif ($task->deadline_status === 'due_soon')
                <flux:badge size="sm" variant="subtle" color="yellow">
                    Due soon
                </flux:badge>
            @elseif ($task->is_completed)
                <flux:badge size="sm" variant="subtle" color="green">
                    Completed
                </flux:badge>
            @endif
        </div>

        {{-- Actions --}}
        <div class="flex justify-end gap-1 opacity-70 transition hover:opacity-100">
            @if ($task->is_completed === 0)
                <flux:button size="xs" icon="check-circle" variant="ghost"
                    wire:click="toggleComplete({{ $task->id }})" />
            @else
                <flux:button size="xs" icon="arrow-path" variant="ghost"
                    wire:click="toggleComplete({{ $task->id }})" />
            @endif

            <flux:button size="xs" icon="pencil" variant="ghost"
                wire:click="$dispatchTo('task-modal', 'open-task-modal', { taskId: {{ $task->id }} })" />

            <flux:button size="xs" icon="trash" variant="ghost" color="red"
                wire:click="delete({{ $task->id }})" wire:confirm="Are you sure?" />
        </div>
    </div>
</div>
