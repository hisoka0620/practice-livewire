import assert from "node:assert/strict";
import test from "node:test";
import {
    combineDateAndTime,
    formatEventTime,
    formatForServer,
    formatTooltipDeadline,
    resolveNewDeadline,
} from "../../../resources/js/calendar/date-utils.js";

assert.equal(
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    "America/Los_Angeles",
    "calendar date utility tests require TZ=America/Los_Angeles",
);

test("formats a UTC ISO instant in the supplied timezone", () => {
    const instant = "2026-10-01T15:30:00.000Z";

    assert.equal(formatEventTime(instant, "America/Los_Angeles"), "8:30 am");
    assert.equal(
        formatTooltipDeadline(instant, "America/Los_Angeles"),
        "Thu, Oct 1, 2026, 8:30 AM",
    );
    assert.equal(formatEventTime(null, "America/Los_Angeles"), "");
    assert.equal(formatTooltipDeadline(null, "America/Los_Angeles"), "none");
});

test("formats server values as UTC ISO strings", () => {
    assert.equal(
        formatForServer(new Date("2026-10-01T08:30:00-07:00")),
        "2026-10-01T15:30:00.000Z",
    );
});

test("combines a local date with a local time", () => {
    const datePart = new Date(2026, 9, 3);
    const timePart = new Date(2026, 9, 1, 23, 30, 45);

    assert.equal(
        combineDateAndTime(datePart, timePart).toISOString(),
        "2026-10-04T06:30:45.000Z",
    );
    assert.equal(
        combineDateAndTime(datePart, null).toISOString(),
        "2026-10-03T07:00:00.000Z",
    );
});

test("preserves native local Date behavior at DST boundaries", () => {
    const springDate = new Date(2026, 2, 8);
    const springTime = new Date(2026, 2, 7, 2, 30);
    const fallDate = new Date(2026, 10, 1);
    const fallTime = new Date(2026, 9, 31, 1, 30);

    assert.equal(
        combineDateAndTime(springDate, springTime).toISOString(),
        "2026-03-08T10:30:00.000Z",
    );
    assert.equal(
        combineDateAndTime(fallDate, fallTime).toISOString(),
        "2026-11-01T08:30:00.000Z",
    );
});

test("resolves monthly drops by retaining the original local time", () => {
    const start = new Date(2026, 9, 3);
    const deadline = resolveNewDeadline({
        view: { type: "dayGridMonth" },
        event: { start },
        oldEvent: {
            extendedProps: { deadline: "2026-10-01T06:30:00.000Z" },
        },
    });

    assert.equal(deadline.toISOString(), "2026-10-04T06:30:00.000Z");
});

test("resolves timed drops to the FullCalendar event start", () => {
    const start = new Date("2026-10-04T16:30:00.000Z");

    assert.equal(
        resolveNewDeadline({
            view: { type: "timeGridWeek" },
            event: { start },
        }),
        start,
    );
});
