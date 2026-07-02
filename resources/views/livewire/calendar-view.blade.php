<div wire:key="calendar-view" class="mt-2 rounded-xl border border-zinc-700 bg-zinc-800/90 p-4 text-zinc-100 shadow-sm"
    x-data="taskCalendar($wire)" x-init="init()" @resize.window="resizeCalendar()">
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
            <span class="font-medium text-zinc-100">Priority:</span>
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
            <span class="font-medium text-zinc-100">Status:</span>
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

    {{-- ★ オプションフィルターバー --}}
    <div x-data="{ hasFilter: false }" x-effect="hasFilter = $wire.calendarPriority !== '' || $wire.calendarTaskStatus !== ''"
        class="mb-3 flex flex-wrap items-center gap-3 rounded-xl border border-zinc-700/60 bg-zinc-800/60 px-3 py-2.5 text-zinc-100 shadow-sm backdrop-blur-sm">
        
        {{-- 日付ジャンプ --}}
        <div class="flex items-center gap-2">
            <flux:icon name="calendar-days" class="size-4 text-zinc-400" />
            <input type="month"
                class="rounded-lg border border-zinc-600 bg-zinc-900/80 px-2.5 py-1 text-xs text-zinc-100 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                x-on:change="jumpToMonth($event.target.value)" />
        </div>

        <span class="hidden h-5 w-px bg-zinc-700 sm:block"></span>

        {{-- Priority フィルター --}}
        <div class="flex items-center gap-2">
            <flux:icon name="flag" class="size-4 text-zinc-400" />
            <flux:select size="sm" wire:model.change="calendarPriority" class="w-28! text-xs">
                <flux:select.option value="">All Priorities</flux:select.option>
                <flux:select.option value="high">High</flux:select.option>
                <flux:select.option value="medium">Medium</flux:select.option>
                <flux:select.option value="low">Low</flux:select.option>
            </flux:select>
        </div>

        {{-- Status フィルター --}}
        <div class="flex items-center gap-2">
            <flux:icon name="check-circle" class="size-4 text-zinc-400" />
            <flux:select size="sm" wire:model.change="calendarTaskStatus" class="w-32! text-xs">
                <flux:select.option value="">All Statuses</flux:select.option>
                <flux:select.option value="incomplete">Incomplete</flux:select.option>
                <flux:select.option value="expired">Expired</flux:select.option>
                <flux:select.option value="completed">Completed</flux:select.option>
            </flux:select>
        </div>

        {{-- Reset, shown only when a filter is active --}}
        <button type="button" x-show="hasFilter" x-cloak x-transition.opacity.duration.150ms
            wire:click="clearFilters"
            class="ml-auto flex items-center gap-1 rounded-lg border border-zinc-600 px-2.5 py-1 text-xs text-zinc-300 transition hover:border-zinc-500 hover:bg-zinc-700/50 hover:text-zinc-100">
            <flux:icon name="x-mark" class="size-3.5" />
            Clear Filters
        </button>
    </div>

    <!-- Calendar Container -->
    <div wire:ignore id="task-calendar" class="min-h-[360px] rounded-xl bg-zinc-900/90 text-zinc-100"></div>
</div>
