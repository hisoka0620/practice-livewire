import { Calendar } from "@fullcalendar/core";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

/**
 * Alpine data for the calendar view.
 */
export default (calendarEvents) => ({
    calendar: null,
    events: calendarEvents,
    init() {
        this.renderCalendar();
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
            events: this.events,
            eventClick: (info) => {
                info.jsEvent.preventDefault();
                const taskId = info.event.id;
                if (!taskId) {
                    return;
                }
                if (
                    window?.Livewire &&
                    typeof window.Livewire.dispatchTo === "function"
                ) {
                    window.Livewire.dispatchTo(
                        "task-modal",
                        "open-task-modal",
                        { taskId: Number(taskId) },
                    );
                } else if (this.$wire?.$dispatchTo) {
                    this.$wire.$dispatchTo("task-modal", "open-task-modal", {
                        taskId: Number(taskId),
                    });
                }
            },
            eventDisplay: "block",
            height: "auto",
            fixedWeekCount: false, // 週の固定行数を解除（月によって高さが変動）
            dayMaxEventRows: 3, // 1日に表示するイベント行数上限
            moreLinkContent: (args) => `+${args.num} more`,
            eventTimeFormat: {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
            },
            slotLabelFormat: {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
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
                    html: `
                        <div class="fc-custom-event">
                            <span class="fc-priority-dot" style="background:${dotColor};"></span>
                            <div class="fc-event-text">
                                <div class="fc-event-title">${arg.event.title || ""}</div>
                                ${time}
                            </div>
                        </div>
                    `,
                };
            },
        });

        this.calendar.render();
    },

    updateEvents() {
        if (!this.calendar) {
            return;
        }

        this.calendar.removeAllEventSources();
        this.calendar.addEventSource(this.events);
        this.calendar.render();
    },

    resizeCalendar() {
        if (this.calendar && typeof this.calendar.updateSize === "function") {
            this.calendar.updateSize();
        }
    },

    get calendarEvents() {
        return this.events;
    },

    set calendarEvents(value) {
        this.events = value;
    },
});
