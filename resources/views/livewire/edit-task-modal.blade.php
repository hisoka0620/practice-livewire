<div>
    <form wire:submit.prevent="save">
        <div class="space-y-6">
            <div>
                <flux:heading size="lg">Edit task</flux:heading>
                <flux:text class="mt-2">You can edit task.</flux:text>
            </div>
            <flux:input wire:model="form.title" label="Title" placeholder="Edit Title" />
            <flux:textarea wire:model="form.description" label="Description" placeholder="Edit description." />
            <div class="flex">
                <flux:spacer />
                <flux:button type="submit" variant="primary">Save</flux:button>
            </div>
        </div>
    </form>
</div>
