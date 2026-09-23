<div @class([...$presenter->rowClasses()])>
    <div class="grid grid-cols-5 items-center gap-2 text-sm">

        {{-- Title --}}
        <div class="line-clamp-2 font-medium">
            {!! $presenter->title() !!}
        </div>

        {{-- Description --}}
        <div class="line-clamp-2 text-zinc-400">
            {!! $presenter->description() !!}
        </div>

        {{-- Priority --}}
        <div class="flex justify-center">
            <span class="rounded-md bg-zinc-700 px-2 py-1 text-xs font-semibold">
                {{ $presenter->priorityLabel() }}
            </span>
        </div>

        {{-- Deadline / Status --}}
        <div class="flex flex-col items-center gap-1">
            <span @class($presenter->deadlineClasses())>
                {{ $presenter->deadlineLabel() }}
                @if ($presenter->deadlineHumanDiff())
                    <span class="ml-1 text-xs font-medium">
                        ({{ $presenter->deadlineHumanDiff() }})
                    </span>
                @endif
            </span>

            @if ($badge = $presenter->badge())
                <flux:badge
                    size="sm"
                    variant="subtle"
                    :color="$badge['color']"
                >
                    {{ $badge['label'] }}
                </flux:badge>
            @endif
        </div>

        {{-- Actions --}}
        <div class="flex justify-end gap-1 opacity-70 transition hover:opacity-100">
            @if ($presenter->visualStatus() !== 'completed')
                <flux:button
                    size="xs"
                    icon="check-circle"
                    variant="ghost"
                    wire:click="toggleComplete({{ $task->id }})"
                />
            @else
                <flux:button
                    size="xs"
                    icon="arrow-path"
                    variant="ghost"
                    wire:click="toggleComplete({{ $task->id }})"
                />
            @endif

            <flux:button
                size="xs"
                icon="pencil"
                variant="ghost"
                wire:click="$dispatchTo('task-modal', 'open-task-modal', { taskId: {{ $task->id }} })"
            />

            <flux:button
                size="xs"
                icon="trash"
                variant="ghost"
                color="red"
                wire:click="delete({{ $task->id }})"
                wire:confirm="Are you sure?"
            />
        </div>
    </div>
</div>
