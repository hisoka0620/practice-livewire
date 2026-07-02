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
        this.renderCalendar();

        // calendarEventsプロパティが更新されるたびに発火
        wire.on("calendarEventsUpdated", (payload) => {
            if (!this.calendar) return;

            const events = payload?.events ?? payload ?? [];
            this.calendar.removeAllEventSources();
            this.calendar.addEventSource(events);
            this.toggleNoEventsMessage(events.length === 0);
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
            height: "auto",
            fixedWeekCount: false, // 週の固定行数を解除（月によって高さが変動）
            dayMaxEventRows: 3, // 1日に表示するイベント行数上限
            moreLinkContent: (args) => `+${args.num} more`,
            eventTimeFormat: {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
            },
            slotLabelFormat: {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
            },
            eventContent: (arg) => {
                const props = arg.event.extendedProps || {};
                const rawPriority = String(props.priority ?? "").toLowerCase();

                const priorityMap = {
                    low: { color: "#3b82f6" }, // blue
                    medium: { color: "#fbbf24" }, // yellow
                    high: { color: "#ef4444" }, // red
                };

                const dotColor = priorityMap[rawPriority]?.color || "#94a3b8";
                const time = arg.timeText
                    ? `<div class="fc-event-time">${arg.timeText}</div>`
                    : "";

                return {
                    html: /* HTML */ `
                        <div class="fc-custom-event">
                            <span
                                class="fc-priority-dot"
                                style="background:${dotColor};"
                            ></span>
                            <div class="fc-event-text">
                                <div class="fc-event-title">
                                    ${arg.event.title || ""}
                                </div>
                                ${time}
                            </div>
                        </div>
                    `,
                };
            },

            // イベントのDOMがマウントされた時に呼ばれるフック
            eventDidMount: function (info) {
                const props = info.event.extendedProps;

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

                // Tippy.js をバインド
                tippy(info.el, {
                    content: tooltipContent,
                    allowHTML: true, // HTMLタグを有効にする
                    placement: "right-start", // 表示位置 (top, bottom, left, right)
                    theme: "dark", // テーマ (必要に応じてCSSでカスタム可能)
                    animation: "scale", // アニメーション効果
                });
            },
        });

        this.calendar.render();
    },

    resizeCalendar() {
        if (this.calendar && typeof this.calendar.updateSize === "function") {
            this.calendar.updateSize();
        }
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
        this.calendar.gotoDate(value + '-01');
    }
});
