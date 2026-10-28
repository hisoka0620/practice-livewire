import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import timeGridPlugin from "@fullcalendar/timegrid";
import tippy from "tippy.js";
import { formatEventTime, formatTooltipDeadline } from "./date-utils.js";

export const MOBILE_CALENDAR_MAX_WIDTH = 639;
export const NARROW_DAY_HEADER_MAX_WIDTH = 375;
const SHORT_SCREEN_MAX_HEIGHT = 640;

export function getCalendarHeight(
    height = globalThis.window?.innerHeight ?? 768,
) {
    return height <= SHORT_SCREEN_MAX_HEIGHT ? "auto" : "100%";
}

export function getDayMaxEvents(
    width = globalThis.window?.innerWidth ?? 1024,
    height = globalThis.window?.innerHeight ?? 768,
) {
    return width <= MOBILE_CALENDAR_MAX_WIDTH || height <= SHORT_SCREEN_MAX_HEIGHT
        ? 2
        : true;
}

export function getDayHeaderFormat(
    width = globalThis.window?.innerWidth ?? 1024,
) {
    return {
        weekday: width <= NARROW_DAY_HEADER_MAX_WIDTH ? "narrow" : "short",
    };
}

const EVENT_TOOLTIP_MEDIA_QUERY = "(hover: none) and (pointer: coarse)";

export function createEventTooltipController({
    userTimeZone,
    windowRef = globalThis.window,
    createTippy = tippy,
}) {
    const mediaQuery =
        typeof windowRef?.matchMedia === "function"
            ? windowRef.matchMedia(EVENT_TOOLTIP_MEDIA_QUERY)
            : null;
    const mountedEvents = new Set();
    let destroyed = false;

    const destroyTooltip = (info) => {
        const instance = info.el._tippy;
        if (!instance) return;

        instance.destroy();
        if (info.el._tippy === instance) {
            delete info.el._tippy;
        }
    };

    const createTooltip = (info) => {
        const props = info.event.extendedProps;
        const title = escapeHtml(info.event.title || "");
        const priority = escapeHtml(props.priority || "none");
        const status = escapeHtml(props.status || "none");
        const content = /* HTML */ `
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

        info.el._tippy = createTippy(info.el, {
            content,
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
                            fallbackPlacements: ["left-start", "top", "bottom"],
                        },
                    },
                ],
            },
        });
    };

    const syncEvent = (info) => {
        if (destroyed) return;

        if (mediaQuery?.matches) {
            destroyTooltip(info);
        } else if (!info.el._tippy) {
            createTooltip(info);
        }
    };

    const handleMediaQueryChange = () => {
        mountedEvents.forEach(syncEvent);
    };

    if (mediaQuery?.addEventListener) {
        mediaQuery.addEventListener("change", handleMediaQueryChange);
    } else if (mediaQuery?.addListener) {
        mediaQuery.addListener(handleMediaQueryChange);
    }

    return {
        mount(info) {
            if (destroyed) return;
            mountedEvents.add(info);
            syncEvent(info);
        },
        unmount(info) {
            mountedEvents.delete(info);
            destroyTooltip(info);
        },
        destroy() {
            if (destroyed) return;
            destroyed = true;

            if (mediaQuery?.removeEventListener) {
                mediaQuery.removeEventListener("change", handleMediaQueryChange);
            } else if (mediaQuery?.removeListener) {
                mediaQuery.removeListener(handleMediaQueryChange);
            }

            mountedEvents.forEach(destroyTooltip);
            mountedEvents.clear();
        },
    };
}

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
    eventTooltipController,
    // Comes from the persisted view preference in calendar.js. Must be a
    // destructured parameter returned below — a hardcoded "dayGridMonth" here
    // silently ignored the caller's value and reset reloads back to month.
    initialView = "dayGridMonth",
}) {
    return {
        plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
        timeZone: "local",
        initialView,
        headerToolbar: {
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek",
        },
        views: {
            timeGridWeek: {
                allDaySlot: false,
                // Chips are instant deadlines: the top-level
                // defaultTimedEventDuration (the smallest renderable value)
                // keeps chips at this height. 22px gives the single-row
                // content (dot | time | title | ⋮) a few px of vertical
                // breathing room instead of a flush fit at 16px. Deadlines
                // closer than ~35 grid minutes overlap at this height and
                // render side by side (see slotEventOverlap).
                eventMinHeight: 22,
                // Chips are 16px tall, which FullCalendar classifies as "short"
                // (default eventShortHeight: 30) — that classification appends
                // a " − " suffix to the time text and shrinks the title font,
                // pushing the single-row content out of the chip. Disable it.
                eventShortHeight: 0,
                // Overlapping short windows are laid out side by side, keeping
                // every chip readable instead of the default broad cards that
                // cover half of each other.
                slotEventOverlap: false,
                // Unlike the month grid (which shows date numbers inside cells),
                // the week view headers are the only place carrying the date.
                dayHeaderFormat: {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                },
                // Vertical line at the current time (timeGrid views only).
                nowIndicator: true,
            },
        },
        events: [],
        editable: true,
        // Timed deadline events are sent with `end: null` and get their duration
        // defaulted here. It must stay above zero (zero-length ranges are dropped
        // by range slicing) and below eventMinHeight / the slot scale so week-view
        // chips are sized by eventMinHeight with no empty band below the
        // single-row content. This MUST be a top-level option: the duration is
        // baked into the event store when `end: null` events are normalized
        // (before any view switch), so a views.timeGridWeek override is silently
        // ignored. Month view is unaffected — its chips are content-sized rows.
        defaultTimedEventDuration: "00:01:00",
        eventStartEditable: true,
        eventDurationEditable: false,
        eventDrop: onEventDrop,
        dateClick: onDateClick,
        datesSet: onDatesSet,
        eventClick: onEventClick,
        eventDisplay: "block",
        height: getCalendarHeight(),
        fixedWeekCount: false,
        dayHeaderFormat: getDayHeaderFormat(),
        dayMaxEvents: getDayMaxEvents(),
        eventMaxStack: 2,
        moreLinkClick: "popover",
        // The <span> keeps " more" in the DOM so a CSS media query can hide it on
        // narrow screens without relying on FullCalendar rebuilding the content
        // after a resize. An object of { html: ... } is required because string
        // content from the callback is rendered as escaped text, not HTML.
        moreLinkContent: (args) => ({
            html: `+${args.num}<span class="fc-more-link-label"> more</span>`,
        }),
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

            const priority = priorityMap[rawPriority] || { color: "#94a3b8" };
            const time = formatEventTime(props.deadline, userTimeZone);

            return {
                html: /* HTML */ `
                    <div class="fc-custom-event">
                        <span
                            class="fc-priority-dot"
                            style="background:${priority.color};"
                        ></span>
                        <div class="fc-event-content">
                            <div class="fc-event-time">${time}</div>
                            <div class="fc-event-title">${title}</div>
                        </div>
                        <button
                            class="fc-event-actions-trigger"
                            type="button"
                            aria-label="Actions for ${title}"
                        >
                            <span aria-hidden="true">&#8942;</span>
                        </button>
                    </div>
                `,
            };
        },
        eventDidMount: (info) => {
            info.el.addEventListener("contextmenu", (jsEvent) => {
                jsEvent.preventDefault();
                onEventContextMenu(jsEvent, info.event);
            });
            eventTooltipController?.mount(info);
        },
        eventWillUnmount: (info) => {
            eventTooltipController?.unmount(info);
        },
    };
}
