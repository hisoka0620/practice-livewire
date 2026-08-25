<div class="min-w-auto flex items-center gap-2 rounded-lg border border-zinc-700/70 bg-zinc-900/70 px-2.5 py-2">
    <flux:icon name="check-circle" class="size-4 shrink-0 text-zinc-400" />
    <flux:select size="sm" wire:model.change="calendarTaskStatus" class="min-h-11 w-full text-xs">
        <flux:select.option value="">All Statuses</flux:select.option>
        <flux:select.option value="incomplete">Incomplete</flux:select.option>
        <flux:select.option value="expired">Expired</flux:select.option>
        <flux:select.option value="completed">Completed</flux:select.option>
    </flux:select>
</div>
