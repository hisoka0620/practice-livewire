<div wire:key="calendar-view" class="mt-2 rounded-xl border border-zinc-700 bg-zinc-800/90 p-4 text-zinc-100 shadow-sm"
    x-data="taskCalendar(@js($calendarEvents))" x-init="init();
    $wire.on('update-calendar', (data) => { calendarEvents = data[0].events; })" x-effect="updateEvents()" @resize.window="resizeCalendar()">
    <div class="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
            <p class="text-sm font-semibold text-zinc-100">Calendar View</p>
            <p class="text-sm text-zinc-400">Deadline tasks are shown in a monthly and weekly schedule.</p>
        </div>
    </div>

    <!-- Legend -->
    <div
        class="mb-4 flex flex-wrap items-center gap-x-6 gap-y-3 rounded-lg border border-zinc-700 bg-zinc-800/90 p-3 text-xs text-zinc-300 md:text-sm">
        <div class="flex flex-wrap items-center gap-x-3">
            <span class="font-medium text-zinc-400">Priority:</span>
            <div class="flex items-center gap-1.5">
                <span class="h-2.5 w-2.5 rounded-full bg-[#ef4444]"></span>
                <span class="text-zinc-100">High</span>
            </div>
            <div class="flex items-center gap-1.5">
                <span class="h-2.5 w-2.5 rounded-full bg-[#fbbf24]"></span>
                <span class="text-zinc-100">Medium</span>
            </div>
            <div class="flex items-center gap-1.5">
                <span class="h-2.5 w-2.5 rounded-full bg-[#3b82f6]"></span>
                <span class="text-zinc-100">Low</span>
            </div>
        </div>

        <span class="hidden h-4 w-px bg-zinc-700 sm:block"></span>

        <div class="flex flex-wrap items-center gap-x-3">
            <span class="font-medium text-zinc-400">Status:</span>
            <div class="flex items-center gap-1.5">
                <span class="h-2.5 w-2.5 bg-[#0369A1]"></span>
                <span class="text-zinc-100">In Progress</span>
            </div>
            <div class="flex items-center gap-1.5">
                <span class="h-2.5 w-2.5 bg-[#991B1B]"></span>
                <span class="text-zinc-100">Overdue</span>
            </div>
            <div class="flex items-center gap-1.5">
                <span class="h-2.5 w-2.5 bg-[#D97706]"></span>
                <span class="text-zinc-100">Due Soon</span>
            </div>
            <div class="flex items-center gap-1.5">
                <span class="h-2.5 w-2.5 bg-[#94a3b8]"></span>
                <span class="text-zinc-100">Completed / Others</span>
            </div>
        </div>
    </div>

    <!-- Calendar Container -->
    <div wire:ignore id="task-calendar" class="min-h-[640px] rounded-xl bg-zinc-900/90 text-zinc-100"></div>
</div>
