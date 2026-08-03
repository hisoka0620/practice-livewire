<div>
    <div wire:key="calendar-view"
        class="mt-2 hidden rounded-xl border border-zinc-700 bg-zinc-800/90 p-4 text-zinc-100 shadow-sm xl:block"
        x-data="taskCalendar($wire)">
        <div class="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <p class="text-sm font-semibold text-zinc-100">Calendar View</p>
                <p class="text-sm text-zinc-400">Deadline tasks are shown in a monthly and weekly schedule.</p>
            </div>
        </div>

        <!-- Legend -->
        <div
            class="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-zinc-700 bg-zinc-800/90 p-3 text-[11px] text-zinc-300 sm:gap-x-6 sm:gap-y-3 sm:text-xs md:text-sm">
            <div class="flex flex-wrap items-center gap-x-2 gap-y-1.5 sm:gap-x-3">
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

            <div class="flex flex-wrap items-center gap-x-2 gap-y-1.5 sm:gap-x-3">
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

        {{-- ★ オプションフィルターバー（親がxl:block以上でしか表示されないため、常時flex表示でよい） --}}
        <div x-data="{ hasFilter: false }"
            x-effect="hasFilter = $wire.calendarPriority !== '' || $wire.calendarTaskStatus !== ''"
            class="flex flex-wrap items-center justify-normal gap-2 rounded-xl border border-zinc-700/60 bg-zinc-800/60 px-3 py-2.5 text-zinc-100 shadow-sm backdrop-blur-sm">

            {{-- 日付ジャンプ --}}
            <div wire:ignore
                class="min-w-auto flex items-center gap-2 rounded-lg border border-zinc-700/70 bg-zinc-900/70 px-2.5 py-2">
                <flux:icon name="calendar-days" class="size-4 shrink-0 text-zinc-400" />
                <flux:input
                    class="min-h-11 w-full rounded-md border border-transparent bg-transparent px-1 py-1 text-xs text-zinc-100 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                    placeholder="Select Date.." type="text" x-ref="datePicker" />
            </div>

            {{-- Priority フィルター --}}
            <div
                class="min-w-auto flex items-center gap-2 rounded-lg border border-zinc-700/70 bg-zinc-900/70 px-2.5 py-2">
                <flux:icon name="flag" class="size-4 shrink-0 text-zinc-400" />
                <flux:select size="sm" wire:model.change="calendarPriority" class="min-h-11 w-full text-xs">
                    <flux:select.option value="">All Priorities</flux:select.option>
                    <flux:select.option value="high">High</flux:select.option>
                    <flux:select.option value="medium">Medium</flux:select.option>
                    <flux:select.option value="low">Low</flux:select.option>
                </flux:select>
            </div>

            {{-- Status フィルター --}}
            <div
                class="min-w-auto flex items-center gap-2 rounded-lg border border-zinc-700/70 bg-zinc-900/70 px-2.5 py-2">
                <flux:icon name="check-circle" class="size-4 shrink-0 text-zinc-400" />
                <flux:select size="sm" wire:model.change="calendarTaskStatus" class="min-h-11 w-full text-xs">
                    <flux:select.option value="">All Statuses</flux:select.option>
                    <flux:select.option value="incomplete">Incomplete</flux:select.option>
                    <flux:select.option value="expired">Expired</flux:select.option>
                    <flux:select.option value="completed">Completed</flux:select.option>
                </flux:select>
            </div>

            {{-- Reset, shown only when a filter is active --}}
            <button type="button" x-show="hasFilter" x-cloak x-transition.opacity.duration.150ms
                wire:click="clearFilters"
                class="flex min-h-11 items-center justify-center gap-1 rounded-lg border border-zinc-600 px-3 py-2 text-xs text-zinc-300 transition hover:border-zinc-500 hover:bg-zinc-700/50 hover:text-zinc-100 sm:ml-auto sm:px-2.5">
                <flux:icon name="x-mark" class="size-3.5" />
                Clear Filters
            </button>
        </div>

        {{-- create calendar's task button --}}
        <div class="my-2 flex justify-end">
            <flux:button wire:click="openCreateTaskModal" icon="plus-circle" size="sm">
                New Task
            </flux:button>
        </div>

        <!-- Calendar Container -->
        <div class="relative">
            {{-- 月移動・週移動・フィルター変更を統一的にカバーするローディング --}}
            <div x-show="isLoading" x-cloak x-transition
                class="absolute inset-0 z-10 flex items-center justify-center bg-zinc-900/60">
                <span class="h-8 w-8 animate-spin rounded-full border-2 border-zinc-400 border-t-transparent"></span>
            </div>

            <div wire:ignore id="task-calendar" class="rounded-xl bg-zinc-900/90 text-zinc-100"></div>
        </div>
        {{-- 右クリックコンテキストメニュー --}}
        <div x-show="contextMenu.visible" x-cloak x-on:click.outside="closeContextMenu()"
            class="fixed z-50 w-44 rounded-lg border border-zinc-700 bg-zinc-800 py-1 text-sm text-zinc-100 shadow-lg"
            x-bind:style="`left: ${contextMenu.x}px; top: ${contextMenu.y}px;`">
            <button type="button" x-on:click="toggleTaskCompletion()"
                class="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-zinc-700">
                <flux:icon name="check-circle" class="size-4" />
                <span x-text="contextMenu.isCompleted ? 'Mark as Incomplete' : 'Mark as Complete'"></span>
            </button>
            <flux:modal.trigger name="confirm">
                <button type="button" x-on:click="closeContextMenu(); $flux.modal('confirm').show()"
                    class="flex w-full items-center gap-2 px-3 py-2 text-left text-red-400 hover:bg-zinc-700">
                    <flux:icon name="trash" class="size-4" />
                    <span>Delete</span>
                </button>
            </flux:modal.trigger>
        </div>

        {{-- Modal for confirming the deletion of a calendar event --}}
        <flux:modal name="confirm">
            <div class="flex w-full max-w-md flex-col gap-y-5 p-6">
                <!-- ヘッダーエリア：アイコンとタイトル -->
                <div class="flex items-start gap-x-4">
                    <!-- 警告アイコン（赤い背景の円） -->
                    <div
                        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400">
                        <svg xmlns="http://w3.org" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                            stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5 stroke-current">
                            <path d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                        </svg>
                    </div>

                    <!-- テキストコンテンツ -->
                    <div class="flex flex-1 flex-col gap-y-1">
                        <flux:heading level="2" size="lg"
                            class="font-semibold text-slate-900 dark:text-white">
                            Delete Task
                        </flux:heading>
                        <flux:text size="sm" class="leading-relaxed text-slate-500 dark:text-slate-400">
                            Do you really want to delete this task? This action cannot be undone.
                        </flux:text>
                    </div>
                </div>

                <!-- フッターエリア：ボタン配置（横並び・右寄せ） -->
                <div class="flex flex-row justify-end gap-x-3 border-t border-slate-100 pt-2 dark:border-slate-800">
                    <flux:button size="sm" variant="subtle" class="px-4"
                        x-on:click="$flux.modal('confirm').close()">
                        Cancel
                    </flux:button>
                    <flux:button size="sm" variant="danger" class="px-4 shadow-sm"
                        x-on:click="deleteTaskFromMenu(); $flux.modal('confirm').close()">
                        Delete
                    </flux:button>
                </div>
            </div>
        </flux:modal>
    </div>

    {{-- 1280px未満では案内メッセージのみ --}}
    <div
        class="flex flex-col items-center justify-center gap-3 rounded-xl bg-zinc-800/90 p-8 text-center text-zinc-300 xl:hidden">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none"
            stroke="#71717a" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
        <p class="font-medium text-zinc-200">Calendar view requires a desktop screen (1280px or wider).</p>
        <p class="text-sm text-zinc-400">The calendar view is not supported on screens under 1280px. Please use other
            views, such as the Task List.</p>
    </div>
</div>
