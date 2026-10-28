<div
    wire:ignore
    class="flex min-w-0 w-full items-center gap-2 rounded-lg border border-zinc-700/70 bg-zinc-900/90 px-2.5 py-2 md:w-fit"
>
    <flux:icon
        name="calendar-days"
        class="size-4 shrink-0 text-zinc-400"
    />
    <flux:input
        class="min-h-11 w-full min-w-0 rounded-md border border-transparent bg-transparent px-1 py-1 text-xs text-zinc-100 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
        placeholder="Select Date.."
        type="text"
        x-ref="datePicker"
    />
</div>
