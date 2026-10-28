<div>
    <div
        class="mt-2 rounded-xl border border-zinc-700 bg-zinc-800/90 p-2 text-zinc-100 shadow-sm sm:p-4"
        x-data="taskCalendar($wire)"
    >

        {{-- Calendar Header --}}
        <x-calendar.header />

        <!-- Calendar Legend -->
        <x-calendar.legend />

        <div
            x-data="{
                get hasFilter() {
                    return Boolean(
                        $wire.filters.priority ||
                        $wire.filters.taskStatus
                    )
                }
            }"
            id="calendar-controls"
            class="flex w-full min-w-0 flex-wrap items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800/90 px-3 py-2.5 text-zinc-100 shadow-sm"
        >
            {{-- Date picker --}}
            <x-calendar.date-picker />

            <x-calendar.filters />
        </div>

        <!-- Calendar Container -->
        <div
            id="calendar-container"
            wire:ignore
            class="relative mt-3"
        >

            <x-calendar.loading-spinner />

            <div
                id="task-calendar"
                class="rounded-xl bg-zinc-900/90 text-zinc-100"
            ></div>
        </div>

        {{-- Right-click context menu --}}
        <x-calendar.context-menu />

        {{-- Modal for confirming the deletion of a calendar event --}}
        <x-calendar.delete-modal />

        {{-- Modal for error notifications --}}
        <x-calendar.error-modal />
    </div>
</div>
