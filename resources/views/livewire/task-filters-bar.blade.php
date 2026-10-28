<div @class([
    'flex w-full items-center gap-3' => $showFilters,
    'flex w-full flex-col gap-3' => !$showFilters,
])>
    <flux:input
        wire:model.live.debounce.500ms="filters.search"
        icon="magnifying-glass"
        placeholder="Search tasks..."
        clearable
        @class([
            'min-w-0 flex-1' => $showFilters,
            'w-full' => !$showFilters,
        ])
    />

    @if ($showFilters)
        <flux:select
            wire:model.change="filters.priority"
            class="w-48! shrink-0"
        >
            @foreach ($this->priorityOptions() as $value => $label)
                <flux:select.option value="{{ $value }}">
                    {{ $label }}{{ $value === '' ? ' priorities' : '' }}
                </flux:select.option>
            @endforeach
        </flux:select>

        <flux:select
            wire:model.change="filters.taskStatus"
            class="w-48! shrink-0"
        >
            @foreach ($this->taskStatusOptions() as $value => $label)
                <flux:select.option value="{{ $value }}">
                    {{ $label }}{{ $value === '' ? ' statuses' : '' }}
                </flux:select.option>
            @endforeach
        </flux:select>
    @endif
</div>
