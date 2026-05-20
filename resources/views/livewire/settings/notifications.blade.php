<?php

use Livewire\Volt\Component;

new class extends Component {
    public bool $notifications = false;

    public function mount(): void
    {
        $this->notifications = auth()->user()->pushSubscriptions()->exists();
    }
}; ?>

@push('head')
    <meta name="push-js-url" content="{{ Vite::asset('resources/js/push.js') }}">
@endpush

<section class="w-full">
    @include('partials.settings-heading')

    <x-settings.layout :heading="__('Notifications')" :subheading="__('Manage your notification preferences')">
        <div
            x-data="pushNotifications"
            x-init="init"
        >
            <flux:field variant="inline">
                <flux:label>{{ __('Enable browser notifications') }}</flux:label>

                <flux:switch
                    wire:model.live="notifications"
                    x-on:change="toggle($event.target.checked)"
                    x-bind:disabled="isLocked"
                />

                <flux:error name="notifications" />
            </flux:field>

            <flux:text class="mt-2 text-sm text-amber-600" x-show="isLocked" x-cloak>
                {{ __("Notifications are blocked. Please allow them from your browser's site settings.") }}
            </flux:text>
        </div>
    </x-settings.layout>
</section>

@script
<script>
    const pushJsUrl = document.querySelector('meta[name="push-js-url"]')?.getAttribute('content');

    Alpine.data('pushNotifications', () => ({
        isLocked: false,

        // =============================
        // Init
        // =============================

        async init() {
            if (!('Notification' in window) || !('serviceWorker' in navigator)) return;

            if (Notification.permission === 'denied') {
                this.lock();
                return;
            }

            const sub = await this.getSubscription();
            const isSubscribed = Notification.permission === 'granted' && !!sub;
            $wire.notifications = isSubscribed;
        },

        // =============================
        // Helpers
        // =============================

        async getSubscription() {
            const reg = await navigator.serviceWorker.ready;
            return reg.pushManager.getSubscription();
        },

        lock() {
            this.isLocked = true;
            $wire.notifications = false;
        },

        // =============================
        // Toggle handler
        // =============================

        async toggle(enabled) {
            try {
                if (enabled) {
                    const { subscribePush } = await import(pushJsUrl);
                    await subscribePush();

                    if (Notification.permission === 'denied') {
                        this.lock();
                    } else if (Notification.permission !== 'granted') {
                        $wire.notifications = false;
                    }
                } else {
                    const { unsubscribePush } = await import(pushJsUrl);
                    await unsubscribePush();
                }
            } catch (err) {
                console.error('Push toggle failed:', err);
                $wire.notifications = !enabled;
            }
        },
    }));
</script>
@endscript
