/**
 * Build a display string from a deadline (an ISO 8601 string with UTC offset).
 */
export function formatEventTime(isoString, timeZone) {
    if (!isoString) return "";
    return new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZone,
    })
        .format(new Date(isoString))
        .toLowerCase();
}

export function formatTooltipDeadline(isoString, timeZone) {
    if (!isoString) return "none";
    // Replicates the look of toDayDateTimeString() (e.g. "Sun, Jun 1, 2025 3:00 PM")
    return new Intl.DateTimeFormat("en-US", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZone,
    }).format(new Date(isoString));
}

export function formatForServer(date) {
    return date.toISOString();
}

/**
 * Combine the date of datePart with the time of timePart. Uses midnight when timePart is missing.
 */
export function combineDateAndTime(datePart, timePart) {
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
 * Resolve the new deadline from FullCalendar's drop info.
 */
export function resolveNewDeadline(info) {
    if (info.view.type !== "dayGridMonth") {
        return info.event.start;
    }

    const oldDeadlineStr = info.oldEvent.extendedProps?.deadline;
    const oldTime = oldDeadlineStr ? new Date(oldDeadlineStr) : null;

    return combineDateAndTime(info.event.start, oldTime);
}

const WEEK_SCROLL_CONTEXT_MINUTES = 90; // Keep ~1.5h of schedule above the now indicator
const WEEK_DEFAULT_SCROLL_TIME = { hours: 6, minutes: 0, seconds: 0 };

/**
 * Decide the week view scroll position for the displayed range as a
 * DurationInput for calendar.scrollToTime(). Weeks containing "now" scroll so
 * that some schedule above the current-time indicator stays visible; any other
 * week falls back to FullCalendar's 6:00 default. Crossing midnight backwards
 * clamps to 0:00 (a duration counts from midnight, not from the previous
 * evening). Crossing DST inside the context window shifts the hint by one
 * hour, an acceptable drift for a scroll position.
 */
export function resolveWeekScrollTime(viewStart, viewEnd, now) {
    if (!(viewStart <= now && now < viewEnd)) {
        return { ...WEEK_DEFAULT_SCROLL_TIME };
    }

    const target = new Date(
        now.getTime() - WEEK_SCROLL_CONTEXT_MINUTES * 60 * 1000,
    );
    const targetMidnight = new Date(
        target.getFullYear(),
        target.getMonth(),
        target.getDate(),
    );
    const nowMidnight = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
    );

    if (target < nowMidnight) {
        return { hours: 0, minutes: 0, seconds: 0 };
    }

    const minutes = Math.floor((target - targetMidnight) / 60000);

    return {
        hours: Math.floor(minutes / 60),
        minutes: minutes % 60,
        seconds: 0,
    };
}
