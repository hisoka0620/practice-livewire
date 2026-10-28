<div class="flex w-full min-w-0 flex-1 flex-wrap items-center gap-2 text-zinc-100 md:w-auto">

    {{-- Priority filter --}}
    <x-calendar.priority-filter />

    {{-- Status filter --}}
    <x-calendar.status-filter />

    {{-- Reset, shown only when a filter is active --}}
    <x-calendar.clear-filters />
</div>
