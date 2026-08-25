<div class="mx-auto max-w-6xl px-4">
    
    {{-- Notification Banner --}}
    <livewire:push-notification-banner />
    {{-- Modal --}}
    <livewire:task-modal />

    {{-- ================= Header ================= --}}
    <div @class([
        'border-b border-zinc-700 bg-zinc-800/90 backdrop-blur',
        'sticky top-0 z-20' => $view === 'list',
    ])>
        <div class="space-y-4 py-4">

            {{-- Title + Primary Action --}}
            <div class="flex items-center justify-between">
                <flux:heading size="xl" level="1">
                    Todo List
                </flux:heading>

                <x-tasks.create-button />
            </div>

            {{-- Controls --}}
            <div class="flex flex-wrap items-center gap-3">
                <flux:input wire:model.live.debounce.500ms="search" icon="magnifying-glass" placeholder="Search tasks..."
                    clearable />

                <flux:select wire:model.change="priority" class="w-48!">
                    <flux:select.option value="">All priorities</flux:select.option>
                    <flux:select.option value="low">Low</flux:select.option>
                    <flux:select.option value="medium">Medium</flux:select.option>
                    <flux:select.option value="high">High</flux:select.option>
                </flux:select>

                <flux:button.group>
                    @foreach ($this->taskStatusOptions() as $value => $label)
                        <flux:button size="sm" wire:click="changeTaskStatus('{{ $value }}')"
                            :variant="$taskStatus === $value ? 'filled' : 'ghost'">
                            {{ $label }}
                        </flux:button>
                    @endforeach
                </flux:button.group>

                <flux:button.group>
                    <flux:button size="sm" wire:click="changeView('list')"
                        :variant="$view === 'list' ? 'filled' : 'ghost'">
                        List
                    </flux:button>
                    <flux:button size="sm" wire:click="changeView('calendar')"
                        :variant="$view === 'calendar' ? 'filled' : 'ghost'">
                        Calendar
                    </flux:button>
                </flux:button.group>
            </div>

            <!-- Overdue Tasks Notification -->
            @if ($overdueTasksCount > 0 && $taskStatus !== 'expired')
                <div class="rounded-md border border-red-500/30 bg-red-950/70 px-4 py-3 text-sm text-red-100">
                    <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <p>
                            You have {{ $overdueTasksCount }} overdue task{{ $overdueTasksCount === 1 ? '' : 's' }}.
                            Please review them with priority.
                        </p>
                        <flux:button size="sm" color="red" wire:click="$set('taskStatus','expired')">
                            Show Expired Tasks
                        </flux:button>
                    </div>
                </div>
            @endif
        </div>

        {{-- ================= Task List Header ================= --}}
        @if ($view === 'list')
            <div wire:key="list-view"
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
        @endif
    </div>

    {{-- ================= Calendar ================= --}}
    @if ($view === 'calendar')
        <livewire:calendar-view wire:key="calendar-view" />
    @endif

    {{-- ================= Task List ================= --}}
    @if ($view === 'list')
        <div class="mt-2 space-y-2">
            @if ($tasks->isEmpty())
                <x-todos.task-not-found />
            @else
                @foreach ($tasks as $task)
                    <x-todos.task :$task :key="$task->id" />
                @endforeach
            @endif
        </div>
    @endif
</div>
