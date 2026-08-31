<div x-data="{
    hasFilter: false,
    priority: $wire.entangle('priority'),
    taskStatus: $wire.entangle('taskStatus'),
    loadEvents() {
        $wire.loadEventsIfRangeSet();
    },
    applyFilters() {
        Livewire.dispatchTo('todo-list', 'calendar-filters-update', {
            priority: this.priority,
            taskStatus: this.taskStatus,
        });
    },
    clearFilters() {
        Livewire.dispatchTo('todo-list', 'calendar-filters-clear');
    },
}" x-effect="hasFilter = priority !== '' || taskStatus !== ''"
    class="flex flex-wrap items-center justify-normal gap-2 rounded-xl border border-zinc-700/60 bg-zinc-800/60 px-3 py-2.5 text-zinc-100 shadow-sm backdrop-blur-sm">

    {{-- 日付ジャンプ --}}
    <x-calendar.date-picker />

    {{-- Priority フィルター --}}
    <x-calendar.priority-filter />

    {{-- Status フィルター --}}
    <x-calendar.status-filter />

    {{-- Reset, shown only when a filter is active --}}
    <x-calendar.clear-filters />
</div>
