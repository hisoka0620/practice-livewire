<div>
    @foreach($tasks as $task)
    <div class="flex flex-col md:flex-row gap-x-2 bg-white p-4 mb-3 rounded">
        <div>
            <flux:heading size="md" level="2" class="bg-zinc-600 text-white rounded text-center px-2 py-1">Title
            </flux:heading>
            <flux:text class="mt-2 text-zinc-600 text-center">{{ $task->title }}</flux:text>
        </div>
        <flux:separator vertical class="!bg-zinc-400 mx-3" />
        <div>
            <flux:heading size="md" level="2" class="bg-zinc-600 text-white rounded text-center px-2 py-1">Description
            </flux:heading>
            <flux:text class="mt-2 text-zinc-600 text-center text-ellipsis">{{ $task->description }}</flux:text>
        </div>
        <flux:separator vertical class="!bg-zinc-400 mx-3" />
        <div>
            <flux:heading size="md" level="2" class="bg-zinc-600 text-white rounded text-center px-2 py-1">is_completed
            </flux:heading>
            <flux:text class="mt-2 text-zinc-600 text-center">{{ $task->is_completed === 0 ? 'uncomplete' : 'complete' }}</flux:text>
        </div>
        <flux:separator vertical class="!bg-zinc-400 mx-3" />
        <div>
            <flux:heading size="md" level="2" class="bg-zinc-600 text-white rounded text-center px-2 py-1">created_at
            </flux:heading>
            <flux:text class="mt-2 text-zinc-600 text-center">{{ $task->created_at }}</flux:text>
        </div>
        <flux:separator vertical class="!bg-zinc-400 mx-3" />
        <div>
            <flux:heading size="md" level="2" class="bg-zinc-600 text-white rounded text-center px-2 py-1">updated_at
            </flux:heading>
            <flux:text class="mt-2 text-zinc-600 text-center">{{ $task->updated_at }}</flux:text>
        </div>
        <flux:separator vertical class="!bg-zinc-400 mx-3" />
        <div class="flex flex-row items-center gap-x-2 mr-3">
            <flux:button variant="primary" color="green">Edit</flux:button>
            <flux:button variant="primary" color="red">Delete</flux:button>
        </div>
    </div>
    @endforeach
</div>
