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
