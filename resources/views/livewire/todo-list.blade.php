<div>
    <flux:heading size="xl" level="1" class="mb-3">TodoList</flux:heading>
    <flux:separator variant="subtle" class="mb-6" />
    <flux:button wire:click="openCreateModal" icon="plus-circle" class="mb-6">Create Task
    </flux:button>
    <livewire:task-modal />
    @foreach($tasks as $task)
    <x-todos.task :$task :key="$task->id" />
    @endforeach
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
