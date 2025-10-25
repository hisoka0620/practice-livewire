<div>
    <div class="bg-white p-4 mb-3 rounded">
        <div class="flex flex-col md:flex-row md:items-center justify-between">
            <div class="flex-grow">
                <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <x-todos.task-item heading="Title">
                        {{ $task->title }}
                    </x-todos.task-item>
                    <x-todos.task-item heading="Description" class="text-ellipsis">
                        {{ $task->description }}
                    </x-todos.task-item>
                    <x-todos.task-item heading="is_completed">
                        {{ $task->is_completed === 0 ? 'uncomplete' : 'complete' }}
                    </x-todos.task-item>
                    <x-todos.task-item heading="created_at">
                        {{ $task->created_at }}
                    </x-todos.task-item>
                    <x-todos.task-item heading="updated_at">
                        {{ $task->updated_at }}
                    </x-todos.task-item>
                </div>
            </div>
            <div class="flex-shrink-0 mt-4 md:mt-0 md:ml-4">
                <div class="flex flex-row md:flex-col xl:flex-row items-center gap-2">
                    <flux:button wire:click="edit({{ $task->id }})" icon="pencil" variant="primary" color="green"
                        class="w-full xl:w-auto">Edit
                    </flux:button>
                    <flux:button wire:click="delete({{ $task->id }})" wire:confirm="Are you sure?" icon="trash"
                        variant="primary" color="red" class="w-full xl:w-auto">Delete</flux:button>
                </div>
            </div>
        </div>
    </div>
</div>
