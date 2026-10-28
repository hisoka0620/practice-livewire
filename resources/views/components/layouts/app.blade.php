<x-layouts.app.sidebar :title="$title ?? null">
    <flux:main class="has-[#task-calendar]:!px-1 sm:has-[#task-calendar]:!px-4">
        {{ $slot }}
    </flux:main>
</x-layouts.app.sidebar>
