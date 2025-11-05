<div>
    <div class="bg-white p-4 mb-3 rounded">
        <div class="flex flex-col">
            <div>
                <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <x-todos.task-item heading="Title">
                        {{ ucfirst($task->title) }}
                    </x-todos.task-item>
                    <x-todos.task-item heading="Description" class="text-ellipsis">
                        {{ ucfirst($task->description) }}
                    </x-todos.task-item>
                    <x-todos.task-item heading="Priority">
                        {{ ucfirst($task->priority) }}
                    </x-todos.task-item>
                </div>
            </div>
            <div class="flex flex-col md:flex-row md:justify-end mt-4 gap-2">
                <div>
                    @if($task->is_completed === 0)
                    <flux:button wire:click="toggleComplete({{ $task->id }})" icon="check-circle" variant="primary"
                        color="blue" class="w-full md:w-auto">Complete
                    </flux:button>
                    @else
                    <flux:button wire:click="toggleComplete({{ $task->id }})" icon="arrow-path"
                        class="bg-zinc-600! hover:bg-zinc-500! w-full md:w-auto">Undo
                        Complete
                    </flux:button>
                    @endif
                </div>
                <div class="flex flex-row gap-2">
                    <flux:button wire:click="edit({{ $task->id }})" icon="pencil" variant="primary" color="green"
                        class="w-full md:w-auto">Edit
                    </flux:button>
                    <flux:button wire:click="delete({{ $task->id }})" wire:confirm="Are you sure?" icon="trash"
                        variant="primary" color="red" class="w-full md:w-auto">Delete</flux:button>
                </div>
            </div>
        </div>
    </div>
</div>
