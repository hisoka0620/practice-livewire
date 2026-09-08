@props(['heading'])

<div>
    <flux:heading size="md" level="2" class="bg-zinc-600 text-white rounded text-center px-2 py-1">
        {{ $heading }}
    </flux:heading>
    <flux:text {{ $attributes->merge(['class' => 'mt-2 text-zinc-600 text-center']) }}>
        {{ $slot }}
    </flux:text>
</div>
