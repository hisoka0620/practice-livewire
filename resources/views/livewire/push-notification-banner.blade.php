<?php

use Livewire\Volt\Component;

new class extends Component {
    //
}; ?>

<div
    x-data="pushBanner"
    x-init="init"
    x-show="visible"
    x-transition:enter="transition ease-out duration-300"
    x-transition:enter-start="opacity-0 -translate-y-2"
    x-transition:enter-end="opacity-100 translate-y-0"
    x-transition:leave="transition ease-in duration-200"
    x-transition:leave-start="opacity-100 translate-y-0"
    x-transition:leave-end="opacity-0 -translate-y-2"
    x-cloak
    class="w-full bg-indigo-600 text-white px-4 py-3"
>
    <div class="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <div class="flex items-center gap-3">
            <flux:icon.bell class="size-5 shrink-0" />
            <p class="text-sm font-medium">
                {{ __('Enable push notifications to stay up to date.') }}
            </p>
        </div>

        <div class="flex items-center gap-3 shrink-0">
            <a
                href="{{ route('settings.notifications') }}"
                class="rounded bg-white px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 transition-colors"
                wire:navigate
            >
                {{ __('Set up') }}
            </a>
            <button
                x-on:click="dismiss"
                class="text-indigo-200 hover:text-white transition-colors"
                aria-label="{{ __('Dismiss') }}"
            >
                <flux:icon.x-mark class="size-5" />
            </button>
        </div>
    </div>
</div>

@script
<script>
    Alpine.data('pushBanner', () => ({
        visible: false,
        storageKey: 'push_banner_dismissed',

        init() {
            if (!('Notification' in window)) return;
            if (Notification.permission !== 'default') return;
            if (sessionStorage.getItem(this.storageKey)) return;

            this.visible = true;
        },

        dismiss() {
            this.visible = false;
            sessionStorage.setItem(this.storageKey, '1');
        },
    }));
</script>
@endscript
