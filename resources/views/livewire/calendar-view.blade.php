<div>
    <div wire:key="calendar-view"
        class="mt-2 hidden rounded-xl border border-zinc-700 bg-zinc-800/90 p-4 text-zinc-100 shadow-sm xl:block"
        x-data="taskCalendar($wire)">

        {{-- Calendar Header --}}
        <x-calendar.header />

        <!-- Calendar Legend -->
        <x-calendar.legend />

        {{-- ★ オプションフィルターバー（親がxl:block以上でしか表示されないため、常時flex表示でよい） --}}
        <x-calendar.filters />

        {{-- create calendar's task button --}}
        <div class="my-2 flex justify-end">
            <x-tasks.create-button label="New Task" size="sm" />
        </div>

        <!-- Calendar Container -->
        <div id="calendar-container" wire:ignore class="relative">
            {{--
                テーブル(fc-view-harness)部分だけに重ねるオーバーレイ。
                JSでピクセル位置を計算するのではなく、taskCalendar()側で
                このx-ref要素を .fc-view-harness（FullCalendarが自前で
                position:relativeを当てている、ツールバーを除いたテーブル本体）
                の子要素として付け替え、absolute inset-0（CSSのみ）で重ねている。
                これにより FullCalendar のツールバー(prev/next・タイトル・ビュー切替)は
                ローディング中も操作可能なまま、グリッド部分だけが覆われる。

                注意: #calendar-container に wire:ignore が必要。付けないと、
                JSでこのdivを移動させた後にLivewireが再レンダリングした際、
                テンプレート上の元の位置（#calendar-container直下）に
                このdivが無いと判断して新しいdivを再生成してしまい、
                オーバーレイが2つ重なって表示される。
            --}}
            <x-calendar.loading-spinner />

            <div id="task-calendar" class="rounded-xl bg-zinc-900/90 text-zinc-100"></div>
        </div>

        {{-- 右クリックコンテキストメニュー --}}
        <x-calendar.context-menu />

        {{-- Modal for confirming the deletion of a calendar event --}}
        <x-calendar.delete-modal />

        {{-- エラー通知用モーダル --}}
        <x-calendar.error-modal />
    </div>

    {{-- 1280px未満では案内メッセージのみ --}}
    <x-calendar.unsupported />
</div>
