<div>
    <form wire:submit.prevent="create">
        <div class="space-y-6">
            <div>
                <flux:heading size="lg">Create task</flux:heading>
                <flux:text class="mt-2">Let's create your task.</flux:text>
            </div>
            <flux:input wire:model="form.title" label="Title" placeholder="Enter Title" />
            <flux:textarea wire:model="form.description" label="Description" placeholder="Enter description." />
            <div class="flex">
                <flux:spacer />
                <flux:button type="submit" variant="primary">Create</flux:button>
            </div>
        </div>
    </form>
</div>
