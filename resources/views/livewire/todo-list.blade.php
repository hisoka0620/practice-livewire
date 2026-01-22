<div class="mx-auto max-w-6xl px-4">

    {{-- Modal --}}
    <livewire:task-modal />

    {{-- ================= Header ================= --}}
    <div class="sticky top-0 z-20 border-b border-zinc-700 bg-zinc-800/90 backdrop-blur">
        <div class="space-y-4 py-4">

            {{-- Title + Primary Action --}}
            <div class="flex items-center justify-between">
                <flux:heading size="xl" level="1">
                    Todo List
                </flux:heading>

                <flux:button wire:click="$dispatchTo('task-modal', 'open-task-modal')" icon="plus-circle">
                    Create Task
                </flux:button>
            </div>

            {{-- Controls --}}
            <div class="flex flex-wrap items-center gap-3">
                <flux:input wire:model.live="search" icon="magnifying-glass" placeholder="Search tasks..." clearable />

                <flux:select wire:model.change="priority" class="w-48!">
                    <flux:select.option value="">All priorities</flux:select.option>
                    <flux:select.option value="low">Low</flux:select.option>
                    <flux:select.option value="medium">Medium</flux:select.option>
                    <flux:select.option value="high">High</flux:select.option>
                </flux:select>

                <flux:button.group>
                    @foreach ($this->taskStatusOptions() as $value => $label)
                        <flux:button size="sm" wire:click="$set('taskStatus', '{{ $value }}')"
                            :variant="$taskStatus === $value ? 'filled' : 'ghost'">
                            {{ $label }}
                        </flux:button>
                    @endforeach
                </flux:button.group>
            </div>
        </div>

        {{-- ================= List Header ================= --}}
        <div
            class="mb-2 grid grid-cols-5 gap-2 rounded-md bg-zinc-700 px-4 py-2 text-center text-sm font-semibold text-zinc-300">
            <div>Title</div>
            <div>Description</div>
            <div>Priority</div>
            <div class="grid place-items-center">
                <span wire:click="$set('sort', '{{ $sort === '' ? 'asc' : ($sort === 'asc' ? 'desc' : '') }}')"
                    class="inline-flex cursor-pointer select-none items-center gap-1 transition hover:text-white">
                    <span>Deadline</span>
                    @if ($sort === '')
                        <flux:icon name="arrows-up-down" variant="micro" />
                    @elseif($sort === 'asc')
                        <flux:icon name="arrow-up" variant="micro" />
                    @elseif($sort === 'desc')
                        <flux:icon name="arrow-down" variant="micro" />
                    @endif
                </span>
            </div>
            <div>Actions</div>
        </div>
    </div>

    {{-- ================= Task List ================= --}}
    <div class="mt-2 space-y-2">
        @if ($tasks->isEmpty())
            <x-todos.task-not-found />
        @else
            @foreach ($tasks as $task)
                <x-todos.task :$task :key="$task->id" />
            @endforeach
        @endif
    </div>
</div>
