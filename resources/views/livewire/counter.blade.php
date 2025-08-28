<div>
    <flux:text class="mb-2 text-5xl">{{ $count }}</flux:text>
    <flux:button.group>
        <flux:button wire:click="increment">+</flux:button>
        <flux:button wire:click="decrement">-</flux:button>
        <flux:button wire:click="resetCount">Reset</flux:button>
    </flux:button.group>
</div>
