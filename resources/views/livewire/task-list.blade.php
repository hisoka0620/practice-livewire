<div>
    <div
        class="mb-2 grid grid-cols-5 gap-2 rounded-md bg-zinc-700 px-4 py-2 text-center text-sm font-semibold text-zinc-300">
        <div>Title</div>
        <div>Description</div>
        <div>Priority</div>
        <div class="grid place-items-center">
            <span
                wire:click="nextSort"
                class="inline-flex cursor-pointer select-none items-center gap-1 transition hover:text-white"
            >
                <span>Deadline</span>
                @if ($sort === '')
                    <flux:icon
                        name="arrows-up-down"
                        variant="micro"
                    />
                @elseif($sort === 'asc')
                    <flux:icon
                        name="arrow-up"
                        variant="micro"
                    />
                @elseif($sort === 'desc')
                    <flux:icon
                        name="arrow-down"
                        variant="micro"
                    />
                @endif
            </span>
        </div>
        <div>Actions</div>
    </div>
    {{-- ================= Task List ================= --}}
    <div class="mt-2 space-y-2">
        @if ($tasks->isEmpty())
            <x-tasks.task-not-found />
        @else
            @foreach ($tasks as $task)
                <x-tasks.task
                    :$task
                    :key="$task->id"
                />
            @endforeach
        @endif
    </div>
</div>
