<div>
    {{-- モーダル表示 --}}
    <flux:modal wire:model="show" name="task-modal" class="md:w-96" wire:close="close">
        <form wire:submit="save">
            <div class="space-y-6">
                <div>
                    <flux:heading size="lg">
                        {{ $task ? 'Edit task' : 'Create task' }}
                    </flux:heading>
                    <flux:text class="mt-2">
                        {{ $task ? 'Edit your task.' : "Let's create your task." }}
                    </flux:text>
                </div>
                <flux:input wire:model="form.title" label="Title" placeholder="Enter Title" />
                <flux:textarea wire:model="form.description" label="Description" placeholder="Enter description." />
                <div class="w-fit">
                    <flux:select wire:model="form.priority" label="Priority" placeholder="Select priority">
                        <flux:select.option value="low">
                            Low</flux:select.option>
                        <flux:select.option value="medium">
                            Medium</flux:select.option>
                        <flux:select.option value="high">
                            High</flux:select.option>
                    </flux:select>
                </div>
                <div class="flex space-x-2">
                    <flux:spacer />
                    <flux:button wire:click="close">Cancel
                    </flux:button>
                    <flux:button type="submit" variant="primary">
                        {{ $task ? 'Update' : 'Create' }}
                    </flux:button>
                </div>
            </div>
        </form>
    </flux:modal>
</div>
