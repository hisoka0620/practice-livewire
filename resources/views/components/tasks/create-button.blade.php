@props([
    'label' => 'Create Task',
    'size' => null,
])

<flux:button icon="plus-circle" :size="$size" wire:click="openCreateTaskModal" {{ $attributes }}>
    {{ $label }}
</flux:button>
