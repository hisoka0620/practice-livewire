<div>
    <flux:heading size="xl" level="1" class="mb-3">TodoList</flux:heading>
    <flux:separator variant="subtle" class="mb-6" />
    <flux:button wire:navigate href="{{ route('todos.create') }}" icon="plus-circle" class="mb-6">Create Task
    </flux:button>
    <flux:modal wire:model="showCreateTaskModal" name="create-task" class="md:w-96"
        @close="$set('showCreateTaskModal', false)">
        <livewire:create-task-modal />
    </flux:modal>
    <x-todos.task :tasks="$tasks" />
</div>
