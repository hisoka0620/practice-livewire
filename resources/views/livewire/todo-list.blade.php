<div>
    <flux:heading size="xl" level="1" class="mb-3">
        TodoList</flux:heading>
    <flux:separator variant="subtle" class="mb-6" />
    <div id="header" class="mb-3 flex items-center justify-between">
        <flux:button wire:click="$dispatchTo('task-modal', 'open-task-modal')" icon="plus-circle">Create Task
        </flux:button>
        <div class="flex justify-end gap-2">
            <form wire:submit class="w-fit">
                <flux:select wire:model.change="priority">
                    <flux:select.option value="">All
                        Priorities</flux:select.option>
                    <flux:select.option value="low">Low
                    </flux:select.option>
                    <flux:select.option value="medium">
                        Medium</flux:select.option>
                    <flux:select.option value="high">High
                    </flux:select.option>
                </flux:select>
            </form>
        </div>
    </div>
    <flux:input wire:model.live="search" class="mb-3" icon="magnifying-glass" placeholder="Search tasks" clearable/>
    <livewire:task-modal />
    @if ($tasks->isEmpty())
    <p class="text-white">No tasks found.</p>
    @else
    @foreach ($tasks as $task)
    <x-todos.task :$task :key="$task->id" />
    @endforeach
    @endif
</div>
