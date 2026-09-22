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
        <div class="space-y-2 py-2">

            {{-- Title + Primary Action --}}
            <div class="flex items-center justify-between">
                <flux:heading
                    size="xl"
                    level="1"
                >
                    Todo List
                </flux:heading>

                <x-tasks.create-button />
            </div>

            <livewire:task-filters-bar
                wire:model.live="filters"
                wire:key="task-filters-bar-{{ $view }}"
                :showFilters="$view === 'list'"
            />

            {{-- View switcher is available in both modes --}}
            <div class="flex justify-end">
                <flux:button.group>
                    <flux:button
                        size="sm"
                        wire:click="changeView('list')"
                        :variant="$view === 'list' ? 'filled' : 'ghost'"
                    >
                        List
                    </flux:button>
                    <flux:button
                        size="sm"
                        wire:click="changeView('calendar')"
                        :variant="$view === 'calendar' ? 'filled' : 'ghost'"
                    >
                        Calendar
                    </flux:button>
                </flux:button.group>
            </div>

            <!-- Overdue Tasks Notification -->
            @if ($overdueTasksCount > 0 && $filters['taskStatus'] !== 'expired')
                <div class="rounded-md border border-red-500/30 bg-red-950/70 px-4 py-3 text-sm text-red-100">
                    <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <p>
                            You have {{ $overdueTasksCount }} overdue task{{ $overdueTasksCount === 1 ? '' : 's' }}.
                            Please review them with priority.
                        </p>
                        <flux:button
                            size="sm"
                            color="red"
                            wire:click="$set('filters.taskStatus', 'expired')"
                        >
                            Show Expired Tasks
                        </flux:button>
                    </div>
                </div>
            @endif
        </div>
    </div>

    {{-- ================= Task List ================= --}}
    @if ($view === 'list')
        <livewire:task-list
            wire:key="task-list"
            wire:model.live="filters"
        />
    @endif

    {{-- ================= Calendar ================= --}}
    @if ($view === 'calendar')
        <livewire:calendar-view
            wire:key="calendar-view"
            wire:model.live="filters"
        />
    @endif
</div>
