<div wire:key="calendar-view" class="mt-2 rounded-xl border border-zinc-700 bg-white p-4 shadow-sm" x-data="taskCalendar(@js($calendarEvents))"
    x-init="init();
    $wire.on('update-calendar', (data) => { calendarEvents = data[0].events; })" x-effect="updateEvents()" @resize.window="resizeCalendar()">
    <div class="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
            <p class="text-sm font-semibold text-slate-900">Calendar View</p>
            <p class="text-sm text-slate-500">Deadline tasks are shown in a monthly and weekly schedule.</p>
        </div>
    </div>

    <div wire:ignore id="task-calendar" class="min-h-[640px] rounded-xl bg-white text-slate-900"></div>
</div>
