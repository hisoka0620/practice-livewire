<flux:modal name="confirm">
    <div class="flex w-full max-w-md flex-col gap-y-5 p-6">
        <!-- ヘッダーエリア：アイコンとタイトル -->
        <div class="flex items-start gap-x-4">
            <!-- 警告アイコン（赤い背景の円） -->
            <div
                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400">
                <svg xmlns="http://w3.org" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke-linecap="round"
                    stroke-linejoin="round" class="h-5 w-5 stroke-current">
                    <path d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                </svg>
            </div>

            <!-- テキストコンテンツ -->
            <div class="flex flex-1 flex-col gap-y-1">
                <flux:heading level="2" size="lg" class="font-semibold text-slate-900 dark:text-white">
                    Delete Task
                </flux:heading>
                <flux:text size="sm" class="leading-relaxed text-slate-500 dark:text-slate-400">
                    Do you really want to delete this task? This action cannot be undone.
                </flux:text>
            </div>
        </div>

        <!-- フッターエリア：ボタン配置（横並び・右寄せ） -->
        <div class="flex flex-row justify-end gap-x-3 border-t border-slate-100 pt-2 dark:border-slate-800">
            <flux:button size="sm" variant="subtle" class="px-4" x-on:click="$flux.modal('confirm').close()">
                Cancel
            </flux:button>
            <flux:button size="sm" variant="danger" class="px-4 shadow-sm"
                x-on:click="deleteTaskFromMenu(); $flux.modal('confirm').close()">
                Delete
            </flux:button>
        </div>
    </div>
</flux:modal>
