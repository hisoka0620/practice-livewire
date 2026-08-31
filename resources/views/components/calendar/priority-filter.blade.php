<div x-init="$watch('priority', () => loadEvents())" class="min-w-auto flex items-center gap-2 rounded-lg border border-zinc-700/70 bg-zinc-900/70 px-2.5 py-2">
    <flux:icon name="flag" class="size-4 shrink-0 text-zinc-400" />
    <flux:select size="sm" x-model="priority" x-on:change="applyFilters()" class="min-h-11 w-full text-xs">
        <flux:select.option value="">All Priorities</flux:select.option>
        <flux:select.option value="high">High</flux:select.option>
        <flux:select.option value="medium">Medium</flux:select.option>
        <flux:select.option value="low">Low</flux:select.option>
    </flux:select>
</div>
