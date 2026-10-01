<div class="flex min-w-0 flex-1 flex-wrap items-center gap-2 text-zinc-100">

    {{-- Priority フィルター --}}
    <x-calendar.priority-filter />

    {{-- Status フィルター --}}
    <x-calendar.status-filter />

    {{-- Reset, shown only when a filter is active --}}
    <x-calendar.clear-filters />
</div>
