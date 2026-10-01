import { Calendar } from "@fullcalendar/core";
import flatpickr from "flatpickr";
import monthSelectPlugin from "flatpickr/dist/plugins/monthSelect/index.js";
import { getUserTimeZone } from "./deadline";
import {
    attachCalendarOverlay,
    createCalendarLayoutObserver,
} from "./calendar/layout";
import { createLoadingState } from "./calendar/loading-state";
import { registerCalendarCommitLoadingHook } from "./calendar/commit-hook";
import { processEventsByView } from "./calendar/event-utils";
import { createCalendarOptions } from "./calendar/options";
import {
    combineDateAndTime,
    formatForServer,
    resolveNewDeadline,
} from "./calendar/date-utils";

//
const LOADING_DELAY_MS = 200;

/**
 * Alpine data for the calendar view.
 */
export default (wire) => ({
    calendar: null,
    userTimeZone: getUserTimeZone(),
    flatPickr: null, // flatpickr（月選択）インスタンス
    isLoading: false,
    _loadingState: null,
    errorMessage: "",
    datePickerViewType: "dayGridMonth",
    _skipDatePickerSync: false, // flatpickr自身の選択操作によるgotoDateの場合、選んだ日付表示を上書きしないためのフラグ
    _destroyed: false, // Livewire.hookがこのコンポーネントの破棄後に実行されるのを防ぐガード
    _offCommitHook: null,
    _onScroll: null, // document.addEventListener("scroll", ...)に渡した関数参照（removeEventListenerで同一参照が必要なため保持）
    _calendarEl: null,
    _onCalendarMouseDown: null,
    _layoutResizeObserver: null, // ツールバー要素の高さ監視用ResizeObserver（--fc-header-height反映用）
    contextMenu: {
        visible: false,
        x: 0,
        y: 0,
        taskId: null,
        isCompleted: false,
    }, //　右クリック時に表示されるコンテキストメニューの状態管理
    init() {
        this._destroyed = false;
        this._loadingState = createLoadingState(
            LOADING_DELAY_MS,
            (isLoading) => {
                this.isLoading = isLoading;
            },
        );
        // calendarEventsプロパティが更新されるたびに発火
        wire.on("calendarEventsUpdated", (payload) => {
            if (!this.calendar) return;
            const rawEvents = payload?.events ?? payload ?? [];
            // 現在のビューに応じてイベントを加工
            const events = processEventsByView(
                rawEvents,
                this.calendar.view.type,
            );
            this.calendar.removeAllEventSources();
            this.calendar.addEventSource(events);
            this.toggleNoEventsMessage(events.length === 0);
        });

        // このコンポーネントの通信（プロパティ更新・メソッド呼び出し）を検知し、
        // フィルター関連の操作だけ isLoading に反映する（月移動・週移動は
        // datesSet → runWireAction 側が引き続き担当）
        this._offCommitHook = registerCalendarCommitLoadingHook({
            hook: Livewire.hook.bind(Livewire),
            componentId: wire.$id,
            isDestroyed: () => this._destroyed,
            startLoading: () => this.startLoading(),
            notifyError: (message) => this.notifyError(message),
        });

        // スクロール時にメニューを閉じる
        this._onScroll = () => this.closeContextMenu();
        document.addEventListener("scroll", this._onScroll, true);

        this.renderCalendar();
        this.initFlatPickr();
    },
    destroy() {
        this._destroyed = true;
        // Livewireフックの登録解除（安全に呼び出し）
        if (typeof this._offCommitHook === "function") {
            this._offCommitHook();
        }
        document.removeEventListener("scroll", this._onScroll, true);
        this.removeCalendarMouseDownListener();
        this._layoutResizeObserver?.disconnect();
        this.flatPickr?.destroy();
        this.calendar?.destroy();
    },
    /**
     * 月ジャンプ用のflatpickr（monthSelectプラグイン）を初期化する。
     * allowInput を有効化しないことで、キーボード直接入力によるブラウザネイティブ
     * 月入力ウィジェット特有のバグ（年桁の自動補完・0000/1901化）を構造的に回避する。
     */
    initFlatPickr(viewType = "dayGridMonth") {
        const inputEl =
            this.$refs?.datePicker ||
            this.$el.querySelector('[x-ref="datePicker"]');
        if (!inputEl) return;

        // 二重初期化防止（Livewireの再レンダリングやAlpineの再初期化に備えたガード）
        if (this.flatPickr) {
            this.flatPickr.destroy();
            this.flatPickr = null;
        }

        this.datePickerViewType = viewType;

        const viewOptions =
            viewType === "dayGridMonth"
                ? {
                      plugins: [
                          new monthSelectPlugin({
                              shorthand: true,
                              dateFormat: "Y-m",
                              altFormat: "F Y",
                              theme: "dark",
                          }),
                      ],
                      dateFormat: "Y-m",
                      altFormat: "F Y",
                  }
                : {
                      dateFormat: "Y-m-d",
                      altFormat: "F j, Y",
                  };

        this.flatPickr = flatpickr(inputEl, {
            ...viewOptions,
            altInput: true,
            disableMobile: true,
            defaultDate: this.calendar?.getDate() ?? new Date(),
            onChange: (_selectedDates, dateStr) => this.jumpToDate(dateStr),
        });
    },
    /**
     * flatpickrの表示値のみをFullCalendarの表示期間に同期する。
     * @param {Date} currentStart - info.view.currentStart
     */
    syncDatePicker(currentStart) {
        if (!this.flatPickr) return;

        this.flatPickr.setDate(currentStart, false);
    },
    renderCalendar() {
        if (!this.$el) {
            return;
        }

        const calendarEl = this.$el.querySelector("#task-calendar");
        if (!calendarEl) {
            return;
        }

        if (this.calendar) {
            this.calendar.destroy();
        }
        this.removeCalendarMouseDownListener();

        // コンテキストメニューが開いている間、それを閉じるためのクリックが
        // FullCalendar自身のクリック検出（mousedown起点）に渡らないよう、
        // mousedownの段階でキャプチャフェーズで先に握りつぶす
        this._calendarEl = calendarEl;
        this._onCalendarMouseDown = (jsEvent) => {
            if (this.contextMenu.visible) {
                jsEvent.preventDefault();
                jsEvent.stopPropagation();
                this.closeContextMenu();
            }
        };
        calendarEl.addEventListener(
            "mousedown",
            this._onCalendarMouseDown,
            true,
        );

        this.calendar = new Calendar(
            calendarEl,
            createCalendarOptions({
                userTimeZone: this.userTimeZone,
                onEventDrop: (info) => {
                    const taskId = info.event.id;
                    const newDeadline = resolveNewDeadline(info); // ドロップ後の新しい日時（Dateオブジェクト）

                    this.runWireAction(
                        wire.updateTaskDeadline(
                            taskId,
                            formatForServer(newDeadline),
                        ),
                        {
                            onFailure: () => info.revert(),
                        },
                    );
                },
                onDateClick: (info) => {
                    const clicked = info.date;
                    let deadline;

                    if (info.view.type === "dayGridMonth") {
                        const today = new Date();
                        const todayDateOnly = new Date(
                            today.getFullYear(),
                            today.getMonth(),
                            today.getDate(),
                        );
                        const isPast = clicked < todayDateOnly;
                        // 過去日: 0:00固定 / 今日以降: 現在時刻を合成
                        deadline = combineDateAndTime(
                            clicked,
                            isPast ? null : new Date(),
                        );
                    } else {
                        // 週表示: クリックした時間スロットをそのまま使う（合成不要）
                        deadline = clicked;
                    }

                    wire.$dispatchTo("task-modal", "open-task-modal", {
                        taskId: null, // nullの場合は新規作成モードとしてtask-modal側で判定
                        prefillDeadline: formatForServer(deadline),
                    });
                },
                onDatesSet: (info) => {
                    const viewType = info.view.type;
                    if (this.datePickerViewType !== viewType) {
                        // dayGridMonth ⇔ timeGridWeek の切り替え：flatpickrを作り直す
                        this.initFlatPickr(viewType);
                    } else if (this._skipDatePickerSync) {
                        // flatpickr自身の選択操作によるgotoDateなので、
                        // 選んだ日付の表示を週の開始日で上書きしないようスキップする
                        this._skipDatePickerSync = false;
                    } else {
                        // prev/next/todayボタン等による移動：表示値を同期する
                        this.syncDatePicker(info.view.currentStart);
                    }
                    // ビュー切替時はFullCalendarが該当DOMを作り直すため、
                    // 監視対象・オーバーレイの付け替え先を張り直して最新の状態を反映する
                    this.observeCalendarLayout();
                    this.attachOverlayToHarness();
                    this.runWireAction(
                        wire.loadEvents(
                            info.start.toISOString(),
                            info.end.toISOString(),
                        ),
                    );
                },
                onEventClick: (info) => {
                    info.jsEvent.preventDefault();
                    const taskId = info.event.id;
                    if (!taskId) return;
                    wire.$dispatchTo("task-modal", "open-task-modal", {
                        taskId: Number(taskId),
                    });
                },
                onEventContextMenu: (jsEvent, event) =>
                    this.openContextMenu(jsEvent, event),
            }),
        );

        this.calendar.render();
        // 初回描画直後にヘッダー高さの監視を開始し、オーバーレイをharnessへ付け替える
        this.observeCalendarLayout();
        this.attachOverlayToHarness();
    },

    removeCalendarMouseDownListener() {
        if (!this._calendarEl || !this._onCalendarMouseDown) return;

        this._calendarEl.removeEventListener(
            "mousedown",
            this._onCalendarMouseDown,
            true,
        );
        this._calendarEl = null;
        this._onCalendarMouseDown = null;
    },

    /**
     * ローディングオーバーレイ(x-ref="tableOverlay")を .fc-view-harness
     * （FullCalendarのツールバーを除いたテーブル本体部分。FullCalendar自身が
     * position:relativeを当てている）の子要素として付け替える。
     * これにより、オーバーレイ側はCSSの absolute inset-0 だけで
     * ツールバー（prev/next・タイトル・ビュー切替）を除いた範囲にぴったり重なり、
     * getBoundingClientRectによるピクセル計算やResizeObserverでの追従が不要になる。
     * FullCalendarはビュー切替時に.fc-view-harnessを作り直すことがあるため、
     * renderCalendar()後・datesSet時など、harnessが（再）生成されうるタイミングで
     * 都度呼び出す（既に付け替え済みなら何もしない）。
     */
    attachOverlayToHarness() {
        const calendarEl = this.$el?.querySelector("#task-calendar");
        const overlayEl = this.$refs?.tableOverlay;
        attachCalendarOverlay(calendarEl, overlayEl);
    },
    /**
     * ツールバーの高さ変化、およびカレンダー自体の幅の変化を監視し、
     * 変化のたびにlayoutモジュールでヘッダー高さを更新する。
     * FullCalendarはビュー切替時に該当DOMを作り直すため、呼ばれるたびに
     * 監視対象を張り直す（disconnect→observe）。
     * ローディングオーバーレイの位置は attachOverlayToHarness() が別途担当するため
     * （CSSの absolute inset-0 のみで追従する）、ここでは扱わない。
     */
    observeCalendarLayout() {
        const calendarEl = this.$el?.querySelector("#task-calendar");
        if (!calendarEl) return;

        this._layoutResizeObserver?.disconnect();
        this._layoutResizeObserver = createCalendarLayoutObserver(calendarEl);
    },
    /**
     * 一定時間(LOADING_DELAY_MS)経過してもまだ処理中の場合のみisLoadingを表示する
     */
    startLoading() {
        return this._loadingState.start();
    },

    /**
     * wireメソッド呼び出しを共通処理でラップする。
     * @param {Promise<boolean>} promise - wire.xxx() の戻り値
     * @param {object} [options]
     * @param {() => void} [options.onFailure] - 失敗時（false or 例外）に呼ぶ追加処理（例: info.revert()）
     */
    async runWireAction(promise, { onFailure } = {}) {
        const stopLoading = this.startLoading();
        try {
            const success = await promise;
            if (!success) {
                onFailure?.();
                this.notifyError(
                    "The operation failed. You may lack the necessary permissions, or the target may no longer exist.",
                );
            }
        } catch (e) {
            onFailure?.();
            this.notifyError(
                "A communication error occurred. Please try again.",
            );
        } finally {
            stopLoading();
        }
    },

    /**
     * エラー通知
     */
    notifyError(message) {
        this.errorMessage = message;
        this.$flux.modal("error-notification").show();
    },
    /**
     * 右クリックメニューを開く
     */
    openContextMenu(jsEvent, event) {
        const props = event.extendedProps || {};
        this.contextMenu = {
            visible: true,
            x: jsEvent.clientX,
            y: jsEvent.clientY,
            taskId: event.id,
            isCompleted: !!props.completed,
        };
    },

    closeContextMenu() {
        this.contextMenu.visible = false;
    },
    /**
     * 完了/未完了をトグルする
     */
    toggleTaskCompletion() {
        const taskId = this.contextMenu.taskId;
        this.closeContextMenu();
        if (!taskId) return;
        this.runWireAction(wire.toggleTaskCompletion(taskId));
    },
    /**
     * タスクを削除する
     */
    deleteTaskFromMenu() {
        const taskId = this.contextMenu.taskId;
        this.closeContextMenu();
        if (!taskId) return;
        this.runWireAction(wire.deleteTask(taskId));
    },
    /**
     * イベントがない場合に、その旨のメッセージを表示します
     * @param {boolean} show イベントがある場合はfalse、ない場合はtrue
     * @returns {void}
     */
    toggleNoEventsMessage(show) {
        const calendarEl = this.$el.querySelector("#task-calendar");
        if (!calendarEl) return;

        const existing = calendarEl.querySelector(".fc-no-events-overlay");

        if (show && !existing) {
            const overlay = document.createElement("div");
            overlay.className = "fc-no-events-overlay";
            overlay.innerHTML = /* HTML */ `
                <div class="fc-no-events-overlay__icon">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="28"
                        height="28"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#71717a"
                        stroke-width="1.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    >
                        <rect x="3" y="4" width="18" height="18" rx="2" />
                        <path d="M16 2v4M8 2v4M3 10h18" />
                        <line
                            x1="8"
                            y1="15"
                            x2="16"
                            y2="15"
                            stroke-dasharray="2 2"
                        />
                    </svg>
                </div>
                <p class="fc-no-events-overlay__title">
                    No deadline tasks this month.
                </p>
                <p class="fc-no-events-overlay__sub">
                    Try a different month or adjust your filters.
                </p>
            `;
            calendarEl.appendChild(overlay);
        } else if (!show && existing) {
            existing.remove();
        }
    },
    jumpToDate(value) {
        // value は "2026-06" 形式
        if (!this.calendar || !value) return;
        const target = value.length === 7 ? value + "-01" : value;
        // このgotoDateによって発火するdatesSetでは、flatpickrが今表示している
        // 選択日付をcurrentStart（週の開始日）で上書きしないようにする
        this._skipDatePickerSync = true;
        this.calendar.gotoDate(target);
    },
});
