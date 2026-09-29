/**
 * deadline（UTC offset付きISO 8601文字列）から表示用文字列を生成する。
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
    // toDayDateTimeString() と同等の見た目（例: "Sun, Jun 1, 2025 3:00 PM"）を再現
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
 * datePartの日付とtimePartの時刻を合成する。timePartがない場合は0時を使う。
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
 * FullCalendarのdrop infoから新しいdeadlineを解決する。
 */
export function resolveNewDeadline(info) {
    if (info.view.type !== "dayGridMonth") {
        return info.event.start;
    }

    const oldDeadlineStr = info.oldEvent.extendedProps?.deadline;
    const oldTime = oldDeadlineStr ? new Date(oldDeadlineStr) : null;

    return combineDateAndTime(info.event.start, oldTime);
}
