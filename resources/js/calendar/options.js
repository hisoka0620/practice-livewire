import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import timeGridPlugin from "@fullcalendar/timegrid";
import tippy from "tippy.js";
import { formatEventTime, formatTooltipDeadline } from "./date-utils.js";

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

export function createCalendarOptions({
    userTimeZone,
    onEventDrop,
    onDateClick,
    onDatesSet,
    onEventClick,
    onEventContextMenu,
}) {
    return {
        plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
        timeZone: "local",
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
        eventDurationEditable: false,
        eventDrop: onEventDrop,
        dateClick: onDateClick,
        datesSet: onDatesSet,
        eventClick: onEventClick,
        eventDisplay: "block",
        height: "100%",
        fixedWeekCount: false,
        dayMaxEvents: true,
        eventMaxStack: 2,
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
                low: { color: "#3b82f6" },
                medium: { color: "#fbbf24" },
                high: { color: "#ef4444" },
            };

            const dotColor = priorityMap[rawPriority]?.color || "#94a3b8";
            const time = formatEventTime(props.deadline, userTimeZone);

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
        eventDidMount: (info) => {
            const props = info.event.extendedProps;
            const title = escapeHtml(info.event.title || "");
            const priority = escapeHtml(props.priority || "none");
            const status = escapeHtml(props.status || "none");

            if (info.el._tippy) {
                info.el._tippy.destroy();
            }

            const tooltipContent = /* HTML */ `
                <div style="text-align: left; padding: 4px;">
                    <strong>${title}</strong><br />
                    <hr style="border-color: #555; margin: 4px 0;" />
                    ⏰ Deadline:
                    ${formatTooltipDeadline(props.deadline, userTimeZone)}<br />
                    🔥 Priority: ${priority}<br />
                    📌 Status:
                    <span style="color: #fff;">${status}</span>
                </div>
            `;

            const tooltipOptions = {
                content: tooltipContent,
                allowHTML: true,
                placement: "right-start",
                theme: "dark",
                animation: "scale",
                trigger: "mouseenter focus",
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

            info.el._tippy = tippy(info.el, tooltipOptions);

            info.el.addEventListener("contextmenu", (jsEvent) => {
                jsEvent.preventDefault();
                onEventContextMenu(jsEvent, info.event);
            });
        },
        eventWillUnmount: (info) => {
            info.el._tippy?.destroy();
        },
    };
}
