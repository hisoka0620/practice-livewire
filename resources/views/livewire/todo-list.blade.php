<div>
    <flux:heading size="xl" level="1" class="mb-3">TodoList</flux:heading>
    <flux:separator variant="subtle" class="mb-6" />
    <div id="header" class="flex items-center justify-between mb-6">
        <flux:button wire:click="openCreateModal" icon="plus-circle">Create Task
        </flux:button>
        <div class="flex justify-end gap-2">
            <form wire:submit class="w-fit">
                <flux:select placeholder="Filter by priority" wire:model.live="priority">
                    <flux:select.option value="">All Priorities</flux:select.option>
                    <flux:select.option value="low">Low</flux:select.option>
                    <flux:select.option value="medium">Medium</flux:select.option>
                    <flux:select.option value="high">High</flux:select.option>
                </flux:select>
            </form>
        </div>

    </div>
    <livewire:task-modal />
    @if($tasks->isEmpty())
    <p class="text-white">No tasks found.</p>
    @else
    @foreach($tasks as $task)
    <x-todos.task :$task :key="$task->id" />
    @endforeach
    @endif
</div>

@script
<script>
    document.addEventListener('livewire:initialized', () => {
    // Runs immediately after Livewire has finished initializing
    // on the page...
    if($wire.create || $wire.editTaskId){
        $wire.dispatch('open-task-modal', { taskId: $wire.editTaskId } );
    }
    })
</script>
@endscript
