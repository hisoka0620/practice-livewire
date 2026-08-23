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
 * datePartの「日付」とtimePartの「時刻」を合成した新しいDateを返す。
 * timePartがnull/undefinedの場合は時刻を0:00:00として扱う。
 * - resolveNewDeadline: ドロップ後の日付 + 元のdeadlineの時刻
 * - dateClick: クリックした日付 + 現在時刻
 * など、「日付だけ変えたいが時刻は別の値から持ってきたい」場面で共通利用する。
 */
function combineDateAndTime(datePart, timePart) {
    return new Date(
        datePart.getFullYear(),
        datePart.getMonth(),
        datePart.getDate(),
        timePart ? timePart.getHours() : 0,
        timePart ? timePart.getMinutes() : 0,
        timePart ? timePart.getSeconds() : 0,
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

    return combineDateAndTime(newDateOnly, oldTime);
}

/** HTMLエスケープ */
function escapeHtml(value) {
    return String(value ?? "").replace(
        /[&<>"']/g,
        (character) =>
            ({
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#039;",
            })[character],
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
    _destroyed: false, // Livewire.hookがこのコンポーネントの破棄後に実行されるのを防ぐガード
    _offCommitHook: null,
    _onScroll: null, // document.addEventListener("scroll", ...)に渡した関数参照（removeEventListenerで同一参照が必要なため保持）
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
        // calendarEventsプロパティが更新されるたびに発火
        wire.on("calendarEventsUpdated", (payload) => {
            if (!this.calendar) return;
            const rawEvents = payload?.events ?? payload ?? [];
            // 現在のビューに応じてイベントを加工
            const events = this.processEventsByView(rawEvents);
            this.calendar.removeAllEventSources();
            this.calendar.addEventSource(events);
            this.toggleNoEventsMessage(events.length === 0);
            // task-saved 経由のリロードもここで確実に完了するため、
            // 安全策としてここでも stopLoading しておく（冪等なので害はない）
            this.stopLoading();
        });

        // このコンポーネントの通信（プロパティ更新・メソッド呼び出し）を検知し、
        // フィルター関連の操作だけ isLoading に反映する（月移動・週移動は
        // datesSet → runWireAction 側が引き続き担当）
        this._offCommitHook = Livewire.hook(
            "commit",
            ({ component, commit, succeed, fail }) => {
                if (this._destroyed) return; // 破棄済みインスタンスでは何もしない
                const isOwnFilterCommit =
                    component.id === wire.$id &&
                    ("calendarPriority" in (commit.updates ?? {}) ||
                        "calendarTaskStatus" in (commit.updates ?? {}) ||
                        (commit.calls ?? []).some(
                            (call) => call.method === "clearFilters",
                        ));

                // task-savedはTaskModalなど他コンポーネントのcommitとして
                // 流れてくるため、component.idでの絞り込みをかけない
                const isTaskSavedDispatch = (commit.calls ?? []).some(
                    (call) =>
                        call.method === "__dispatch" &&
                        call.params?.[0] === "task-saved",
                );

                if (!isOwnFilterCommit && !isTaskSavedDispatch) return;

                this.startLoading();
                succeed(() => this.stopLoading());
                fail(() => {
                    this.stopLoading();
                    this.notifyError("The operation failed. Please try again.");
                });
            },
        );

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
                // ビュー切替時はFullCalendarが該当DOMを作り直すため、
                // 監視対象・オーバーレイの付け替え先を張り直して最新の状態を反映する
                this.observeCalendarLayout();
                this.attachOverlayToHarness();
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
            height: "100%",
            fixedWeekCount: false,
            dayMaxEvents: true,
            eventMaxStack: 2, // スタックの最大数を制限
            moreLinkContent: (args) => `+${args.num} more`,
            eventOrder: (firstEvent, secondEvent) => {
                const priorityRank = {
                    high: 3,
                    medium: 2,
                    low: 1,
                };

                const firstRank =
                    priorityRank[firstEvent.extendedProps.priority] ?? 0;
                const secondRank =
                    priorityRank[secondEvent.extendedProps.priority] ?? 0;

                if (firstRank !== secondRank) {
                    return secondRank - firstRank;
                }

                const firstDeadline = new Date(firstEvent.extendedProps.deadline);
                const secondDeadline = new Date(secondEvent.extendedProps.deadline);

                return firstDeadline - secondDeadline;
            },
            eventOrderStrict: true,
            eventContent: (arg) => {
                const props = arg.event.extendedProps || {};
                const rawPriority = String(props.priority ?? "").toLowerCase();
                const title = escapeHtml(arg.event.title || "");
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
                                <div class="fc-event-title">${title}</div>
                            </div>
                        </div>
                    `,
                };
            },
            // イベントのDOMがマウントされた時に呼ばれるフック
            eventDidMount: (info) => {
                const props = info.event.extendedProps;
                const title = escapeHtml(info.event.title || "");
                const priority = escapeHtml(props.priority || "none");
                const status = escapeHtml(props.status || "none");

                if (info.el._tippy) {
                    info.el._tippy.destroy();
                }

                // ツールチップに表示したいHTMLコンテンツを作成
                const tooltipContent = /* HTML */ `
                    <div style="text-align: left; padding: 4px;">
                        <strong>${title}</strong><br />
                        <hr style="border-color: #555; margin: 4px 0;" />
                        ⏰ Deadline: ${formatTooltipDeadline(props.deadline)}<br />
                        🔥 Priority: ${priority}<br />
                        📌 Status:
                        <span style="color: #fff;">${status}</span>
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
        // 初回描画直後にヘッダー高さの監視を開始し、オーバーレイをharnessへ付け替える
        this.observeCalendarLayout();
        this.attachOverlayToHarness();
    },

    /**
     * ツールバーの高さを実測し、#task-calendarのCSS変数
     * --fc-header-height に反映する（.fc-no-events-overlay のpadding-top/
     * グラデーション境界に使用）。
     */
    updateHeaderHeight() {
        const calendarEl = this.$el?.querySelector("#task-calendar");
        if (!calendarEl) return;

        const toolbarEl = calendarEl.querySelector(".fc-header-toolbar");

        // offsetHeightはmargin-bottomを含まないため、要素があれば
        // computed styleから明示的に加算する
        const marginBottom = (el) =>
            el ? parseFloat(getComputedStyle(el).marginBottom) || 0 : 0;
        const height = (toolbarEl?.offsetHeight ?? 0) + marginBottom(toolbarEl);

        if (height > 0) {
            calendarEl.style.setProperty("--fc-header-height", `${height}px`);
        }
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
        const harnessEl = calendarEl?.querySelector(".fc-view-harness");
        const overlayEl = this.$refs?.tableOverlay;
        if (!harnessEl || !overlayEl) return;
        if (overlayEl.parentElement !== harnessEl) {
            harnessEl.appendChild(overlayEl); // 元の要素を削除して新しい親に付け替える
        }
    },
    /**
     * ツールバーの高さ変化、およびカレンダー自体の幅の変化を監視し、
     * 変化のたびに updateHeaderHeight() を呼ぶ（--fc-header-height反映用）。
     * FullCalendarはビュー切替時に該当DOMを作り直すため、呼ばれるたびに
     * 監視対象を張り直す（disconnect→observe）。
     * ローディングオーバーレイの位置は attachOverlayToHarness() が別途担当するため
     * （CSSの absolute inset-0 のみで追従する）、ここでは扱わない。
     */
    observeCalendarLayout() {
        const calendarEl = this.$el?.querySelector("#task-calendar");
        if (!calendarEl) return;

        this._layoutResizeObserver?.disconnect();
        this._layoutResizeObserver = new ResizeObserver(() => {
            this.updateHeaderHeight();
        });

        const toolbarEl = calendarEl.querySelector(".fc-header-toolbar");
        if (toolbarEl) this._layoutResizeObserver.observe(toolbarEl);
        // 幅の変化（ウィンドウリサイズ等）でも正方形を保つよう、
        // カレンダー要素自体の幅も監視対象に加える
        this._layoutResizeObserver.observe(calendarEl);

        // 張り直した直後は次の変化を待たず即座に反映する
        this.updateHeaderHeight();
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
