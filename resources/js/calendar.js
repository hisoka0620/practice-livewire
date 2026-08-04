import { Calendar } from "@fullcalendar/core";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

/**
 * deadline（タイムゾーンなしISO文字列）から表示用文字列を生成するヘルパー群
 */
function formatEventTime(isoString) {
    if (!isoString) return "";
    return new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    })
        .format(new Date(isoString))
        .toLowerCase();
}

function formatTooltipDeadline(isoString) {
    if (!isoString) return "none";
    // toDayDateTimeString() と同等の見た目（例: "Sun, Jun 1, 2025 3:00 PM"）を再現
    return new Intl.DateTimeFormat("en-US", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    }).format(new Date(isoString));
}

function formatForServer(date) {
    const pad = (n) => String(n).padStart(2, "0");
    return (
        `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
        `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
    );
}

/**
 * ドラッグ&ドロップ後の新しいdeadline（Dateオブジェクト）を、
 * 現在のビュー種別に応じて算出する。
 * - dayGridMonth: 終日イベント（allDay:true）として描画しているため、
 *   ドラッグ後のstartは時刻情報を持たない。元のdeadline（extendedProps）から
 *   時刻を取り出し、ドロップ後の「日付」と合成する。
 * - それ以外（timeGridWeek等）: ドラッグ自体が時刻変更の操作なので、
 *   info.event.startをそのまま使う。
 */
function resolveNewDeadline(info) {
    const currentView = info.view.type;

    if (currentView !== "dayGridMonth") {
        return info.event.start;
    }

    const oldDeadlineStr = info.oldEvent.extendedProps?.deadline;
    const oldTime = oldDeadlineStr ? new Date(oldDeadlineStr) : null;
    const newDateOnly = info.event.start;

    return new Date(
        newDateOnly.getFullYear(),
        newDateOnly.getMonth(),
        newDateOnly.getDate(),
        oldTime ? oldTime.getHours() : 0,
        oldTime ? oldTime.getMinutes() : 0,
        oldTime ? oldTime.getSeconds() : 0,
    );
}

//
const LOADING_DELAY_MS = 200;

/**
 * Alpine data for the calendar view.
 */
export default (wire) => ({
    calendar: null,
    flatPickr: null, // flatpickr（月選択）インスタンス
    isLoading: false,
    currentViewType: "dayGridMonth",
    currentDatePickerValue: null, // fullcalendarの開始日付Dateオブジェクト用
    _skipDatePickerSync: false, // flatpickr自身の選択操作によるgotoDateの場合、選んだ日付表示を上書きしないためのフラグ
    _loadingTimer: null, // 遅延表示用タイマー
    _destroyed: false, // Livewire.hookには公式の解除APIがないため、破棄後の実行を防ぐガード
    _offCommitHook: null,
    _onScroll: null, // document.addEventListener("scroll", ...)に渡した関数参照（removeEventListenerで同一参照が必要なため保持）
    contextMenu: {
        visible: false,
        x: 0,
        y: 0,
        taskId: null,
        isCompleted: false,
    }, //　右クリック時に表示されるコンテキストメニューの状態管理
    init() {
        this._destroyed = false;
        // calendarEventsプロパティが更新されるたびに発火
        wire.on("calendarEventsUpdated", (payload) => {
            if (!this.calendar) return;
            const rawEvents = payload?.events ?? payload ?? [];
            // 現在のビューに応じてイベントを加工
            const events = this.processEventsByView(rawEvents);
            this.calendar.removeAllEventSources();
            this.calendar.addEventSource(events);
            this.toggleNoEventsMessage(events.length === 0);
        });

        // このコンポーネントの通信（プロパティ更新・メソッド呼び出し）を検知し、
        // フィルター関連の操作だけ isLoading に反映する（月移動・週移動は
        // datesSet → runWireAction 側が引き続き担当）
        this._offCommitHook = Livewire.hook(
            "commit",
            ({ component, commit, succeed, fail }) => {
                if (this._destroyed) return; // 破棄済みインスタンスでは何もしない
                if (component.id !== wire.$id) return; // 他コンポーネントの通信は無視

                const isFilterCommit =
                    "calendarPriority" in (commit.updates ?? {}) ||
                    "calendarTaskStatus" in (commit.updates ?? {}) ||
                    (commit.calls ?? []).some(
                        (call) => call.method === "clearFilters",
                    );

                if (!isFilterCommit) return;

                this.startLoading();
                succeed(() => this.stopLoading());
                fail(() => this.stopLoading());
            },
        );

        this.renderCalendar();
        this.initFlatPickr();

        // スクロール時にメニューを閉じる
        this._onScroll = () => this.closeContextMenu();
        document.addEventListener("scroll", this._onScroll, true);
    },
    destroy() {
        this._destroyed = true;
        this._offCommitHook();
        document.removeEventListener("scroll", this._onScroll, true);
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

        this.currentViewType = viewType;

        if (viewType === "dayGridMonth") {
            this.flatPickr = flatpickr(inputEl, {
                plugins: [
                    new monthSelectPlugin({
                        shorthand: true,
                        dateFormat: "Y-m",
                        altFormat: "F Y",
                        theme: "dark",
                    }),
                ],
                altInput: true,
                disableMobile: true,
                defaultDate: this.currentDatePickerValue || new Date(),
                onChange: (selectedDates, dateStr) => {
                    this.jumpToDate(dateStr);
                },
            });
        } else {
            // 週表示では日付単位でジャンプできるよう、通常の日付ピッカーに切り替える
            this.flatPickr = flatpickr(inputEl, {
                dateFormat: "Y-m-d",
                altInput: true,
                altFormat: "F j, Y",
                disableMobile: true,
                defaultDate: this.calendar?.getDate() ?? new Date(),
                onChange: (selectedDates, dateStr) => {
                    this.jumpToDate(dateStr);
                },
            });
        }
    },
    /**
     * flatpickrの表示値のみをFullCalendarの現在位置に同期する（モード切替は伴わない）。
     * @param {string} viewType
     * @param {Date} currentStart - info.view.currentStart
     */
    syncDatePicker(viewType, currentStart) {
        if (!this.flatPickr) return;

        if (viewType === "timeGridWeek") {
            this.flatPickr.setDate(currentStart, false);
        } else {
            this.flatPickr.setDate(this.currentDatePickerValue, false);
        }
    },
    /**
     * 現在のカレンダービューに応じてイベント情報を加工します
     * - dayGridMonth: 日付のみ表示（allDay: true）
     * - timeGridWeek: 時間付きで1時間の期間で表示（allDay: false）
     */
    processEventsByView(events) {
        if (!this.calendar || !events.length) {
            return events;
        }

        const currentView = this.calendar.view.type;

        return events.map((event) => {
            if (currentView === "dayGridMonth") {
                // dayGridMonthでは終日イベントとして表示（時間情報を削除）
                return {
                    ...event,
                    allDay: true,
                    start: event.start, // 日付のみ
                    end: null, // endを削除して、startだけの単一日イベントに
                };
            } else if (currentView === "timeGridWeek") {
                if (event.start) {
                    const startDate = new Date(event.start);

                    return {
                        ...event,
                        allDay: false,
                        start: startDate,
                        end: null, // defaultTimedEventDurationに委ねる（実時間ではなく表示上の幅）
                    };
                }
                return event;
            }

            return event;
        });
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

        // コンテキストメニューが開いている間、それを閉じるためのクリックが
        // FullCalendar自身のクリック検出（mousedown起点）に渡らないよう、
        // mousedownの段階でキャプチャフェーズで先に握りつぶす
        calendarEl.addEventListener(
            "mousedown",
            (jsEvent) => {
                if (this.contextMenu.visible) {
                    jsEvent.preventDefault();
                    jsEvent.stopPropagation();
                    this.closeContextMenu();
                }
            },
            true, // true = キャプチャフェーズで登録
        );

        this.calendar = new Calendar(calendarEl, {
            plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
            initialView: "dayGridMonth",
            headerToolbar: {
                left: "prev,next today",
                center: "title",
                right: "dayGridMonth,timeGridWeek",
            },
            views: {
                timeGridWeek: {
                    allDaySlot: false,
                    eventMinHeight: 30,
                },
            },
            events: [],
            editable: true,
            eventStartEditable: true,
            eventDurationEditable: false, // リサイズは無効
            eventDrop: (info) => {
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
            dateClick: (info) => {
                wire.$dispatchTo("task-modal", "open-task-modal", {
                    taskId: null, // nullの場合は新規作成モードとしてtask-modal側で判定
                    prefillDeadline: formatForServer(info.date), // クリックした日付を初期値として渡す
                });
            },
            datesSet: (info) => {
                const viewType = info.view.type;
                this.currentDatePickerValue = info.view.currentStart;
                if (this.currentViewType !== viewType) {
                    // dayGridMonth ⇔ timeGridWeek の切り替え：flatpickrを作り直す
                    this.initFlatPickr(viewType);
                } else if (this._skipDatePickerSync) {
                    // flatpickr自身の選択操作によるgotoDateなので、
                    // 選んだ日付の表示を週の開始日で上書きしないようスキップする
                    this._skipDatePickerSync = false;
                } else {
                    // prev/next/todayボタン等による移動：表示値を同期する
                    this.syncDatePicker(viewType, info.view.currentStart);
                }
                this.runWireAction(wire.loadEvents(info.startStr, info.endStr));
            },
            eventClick: (info) => {
                info.jsEvent.preventDefault();
                const taskId = info.event.id;
                if (!taskId) return;
                wire.$dispatchTo("task-modal", "open-task-modal", {
                    taskId: Number(taskId),
                });
            },
            eventDisplay: "block",
            height: "auto", // コンテナを親に合わせる
            fixedWeekCount: false, // 週の固定行数を解除（月によって高さが変動）
            dayMaxEventRows: 3,
            dayMaxEvents: 3,
            eventMaxStack: 2, // スタックの最大数を制限
            moreLinkContent: (args) => `+${args.num} more`,
            eventContent: (arg) => {
                const props = arg.event.extendedProps || {};
                const rawPriority = String(props.priority ?? "").toLowerCase();

                const priorityMap = {
                    low: { color: "#3b82f6" }, // blue
                    medium: { color: "#fbbf24" }, // yellow
                    high: { color: "#ef4444" }, // red
                };

                const dotColor = priorityMap[rawPriority]?.color || "#94a3b8";

                // ISO 8601形式（タイムゾーンなし）は主要ブラウザで一貫してローカル時刻として解釈されるため信頼できる
                const time = formatEventTime(props.deadline);

                return {
                    html: /* HTML */ `
                        <div class="fc-custom-event">
                            <span
                                class="fc-priority-dot"
                                style="background:${dotColor};"
                            ></span>
                            <div class="fc-event-content">
                                <div class="fc-event-time">${time}</div>
                                <div class="fc-event-title">
                                    ${arg.event.title || ""}
                                </div>
                            </div>
                        </div>
                    `,
                };
            },
            // イベントのDOMがマウントされた時に呼ばれるフック
            eventDidMount: (info) => {
                const props = info.event.extendedProps;

                if (info.el._tippy) {
                    info.el._tippy.destroy();
                }

                // ツールチップに表示したいHTMLコンテンツを作成
                const tooltipContent = /* HTML */ `
                    <div style="text-align: left; padding: 4px;">
                        <strong>${info.event.title}</strong><br />
                        <hr style="border-color: #555; margin: 4px 0;" />
                        ⏰ Deadline: ${formatTooltipDeadline(props.deadline)}<br />
                        🔥 Priority: ${props.priority || "none"}<br />
                        📌 Status:
                        <span style="color: #fff;"
                            >${props.status || "none"}</span
                        >
                    </div>
                `;

                const tooltipOptions = {
                    content: tooltipContent,
                    allowHTML: true, // HTMLタグを有効にする
                    placement: "right-start", // 表示位置 (top, bottom, left, right)
                    theme: "dark", // テーマ (必要に応じてCSSでカスタム可能)
                    animation: "scale", // アニメーション効果
                    trigger: "mouseenter focus",
                    // flipはデフォルトで有効。fallbackの候補を明示したい場合はここで指定する
                    popperOptions: {
                        modifiers: [
                            {
                                name: "flip",
                                options: {
                                    fallbackPlacements: [
                                        "left-start",
                                        "top",
                                        "bottom",
                                    ],
                                },
                            },
                        ],
                    },
                };

                // Tippy.js をバインド
                info.el._tippy = tippy(info.el, tooltipOptions);

                info.el.addEventListener("contextmenu", (jsEvent) => {
                    jsEvent.preventDefault(); // ブラウザ標準の右クリックメニューを抑制
                    this.openContextMenu(jsEvent, info.event);
                });
            },
        });

        this.calendar.render();
    },

    /**
     * 一定時間(LOADING_DELAY_MS)経過してもまだ処理中の場合のみisLoadingを表示する
     */
    startLoading() {
        clearTimeout(this._loadingTimer);
        this._loadingTimer = setTimeout(() => {
            this.isLoading = true;
        }, LOADING_DELAY_MS);
    },

    /**
     * ローディング状態を解除する（表示前でもタイマーを確実にキャンセルする）
     */
    stopLoading() {
        clearTimeout(this._loadingTimer);
        this.isLoading = false;
    },

    /**
     * wireメソッド呼び出しを共通処理でラップする。
     * @param {Promise<boolean>} promise - wire.xxx() の戻り値
     * @param {object} [options]
     * @param {() => void} [options.onFailure] - 失敗時（false or 例外）に呼ぶ追加処理（例: info.revert()）
     */
    async runWireAction(promise, { onFailure } = {}) {
        this.startLoading();
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
            this.stopLoading();
        }
    },

    /**
     * エラー通知（暫定実装）
     */
    notifyError(message) {
        // TODO: 既存のトースト/通知コンポーネントがあればそちらに差し替える
        alert(message);
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
