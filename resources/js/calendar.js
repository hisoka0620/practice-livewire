import { Calendar } from "@fullcalendar/core";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

/**
 * Alpine data for the calendar view.
 */
export default (wire) => ({
    calendar: null,
    init() {
        // calendarEventsプロパティが更新されるたびに発火
        wire.on("calendarEventsUpdated", (payload) => {
            if (!this.calendar) return;
            const rawEvents = payload?.events ?? payload ?? [];
            // ★変更：現在のビューに応じてイベントを加工
            const events = this.processEventsByView(rawEvents);
            this.calendar.removeAllEventSources();
            this.calendar.addEventSource(events);
            this.toggleNoEventsMessage(events.length === 0);
        });
        this.renderCalendar();
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
                // timeGridWeekではtimed eventで1時間の期間を設定
                if (event.start) {
                    const startDate = new Date(event.start);
                    const endDate = new Date(
                        startDate.getTime() + 45 * 60 * 1000,
                    ); // 45分後
                    return {
                        ...event,
                        allDay: false,
                        start: startDate,
                        end: endDate,
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
            datesSet: (info) => {
                wire.loadEvents(
                    info.startStr, // 例: '2025-06-01'
                    info.endStr, // 例: '2025-07-06'（表示範囲の翌日）
                );
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

                // ISO 8601形式（タイムゾーンなし）は主要ブラウザで一貫してローカル時刻として解釈されるため、表示用文字列(deadline)のパースより信頼できる
                const time = props.deadlineIso
                    ? new Intl.DateTimeFormat("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                          hour12: true,
                      })
                          .format(new Date(props.deadlineIso))
                          .toLowerCase()
                    : "";

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
                        ⏰ Deadline: ${props.deadline || "none"}<br />
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
            },
        });

        this.calendar.render();
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
    jumpToMonth(value) {
        // value は "2026-06" 形式
        if (!this.calendar || !value) return;
        this.calendar.gotoDate(value + "-01");
    },
});
