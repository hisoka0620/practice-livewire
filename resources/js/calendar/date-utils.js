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
