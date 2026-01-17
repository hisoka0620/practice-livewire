<div>
    <div @class([
        'mb-3 rounded bg-white p-4 border-l-4',
        'border-red-500 bg-red-100!' => $task->deadline_status === 'overdue',
        'border-yellow-500 bg-yellow-100' => $task->deadline_status === 'due_soon',
    ])>
        <div class="flex flex-col gap-y-6">
            <div>
                @if ($task->deadline_status === 'overdue')
                    <flux:badge variant="solid" color="red" class="mb-2" icon="exclamation-triangle">
                        Overdue</flux:badge>
                @elseif($task->deadline_status === 'due_soon')
                    <flux:badge variant="solid" color="yellow" class="text-white! mb-2" icon="exclamation-circle">
                        Due Soon
                    </flux:badge>
                @endif
                <div class="grid grid-cols-1 gap-4 md:grid-cols-5">
                    <x-todos.task-item heading="Title">
                        {!! $this->highlight($task->title) !!}
                    </x-todos.task-item>
                    <x-todos.task-item heading="Description" class="text-ellipsis">
                        {!! $this->highlight($task->description) !!}
                    </x-todos.task-item>
                    <x-todos.task-item heading="Priority">
                        {!! ucfirst($this->highlight($task->priority)) !!}
                    </x-todos.task-item>
                    <x-todos.task-item heading="Deadline" class="{{ $task->deadline_color_class }}">
                        {{ $task->deadline ?? 'None' }}
                    </x-todos.task-item>
                </div>
            </div>
            <div class="mt-4 flex flex-col gap-2 md:flex-row md:justify-end">
                <div>
                    @if ($task->is_completed === 0)
                        <flux:button wire:click="toggleComplete({{ $task->id }})" icon="check-circle"
                            variant="primary" color="blue" class="w-full md:w-auto">Complete
                        </flux:button>
                    @else
                        <flux:button wire:click="toggleComplete({{ $task->id }})" icon="arrow-path"
                            class="bg-zinc-600! hover:bg-zinc-500! w-full md:w-auto">Undo
                            Complete
                        </flux:button>
                    @endif
                </div>
                <div class="flex flex-row gap-2">
                    <flux:button
                        wire:click="$dispatchTo('task-modal', 'open-task-modal', { taskId: {{ $task->id }} })"
                        icon="pencil" variant="primary" color="green" class="w-full md:w-auto">Edit
                    </flux:button>
                    <flux:button wire:click="delete({{ $task->id }})" wire:confirm="Are you sure?" icon="trash"
                        variant="primary" color="red" class="w-full md:w-auto">Delete</flux:button>
                </div>
            </div>
        </div>
    </div>
</div>
