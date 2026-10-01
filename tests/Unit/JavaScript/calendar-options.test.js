import assert from "node:assert/strict";
import test from "node:test";
import { createCalendarOptions } from "../../../resources/js/calendar/options.js";

test("creates calendar options with Alpine-owned interaction callbacks", () => {
    const callbacks = {
        onEventDrop() {},
        onDateClick() {},
        onDatesSet() {},
        onEventClick() {},
        onEventContextMenu() {},
    };
    const options = createCalendarOptions({
        userTimeZone: "America/Los_Angeles",
        ...callbacks,
    });

    assert.equal(options.timeZone, "local");
    assert.equal(options.initialView, "dayGridMonth");
    assert.equal(options.eventDrop, callbacks.onEventDrop);
    assert.equal(options.dateClick, callbacks.onDateClick);
    assert.equal(options.datesSet, callbacks.onDatesSet);
    assert.equal(options.eventClick, callbacks.onEventClick);
    assert.equal(options.eventDurationEditable, false);
});

test("preserves event ordering and escaped event markup", () => {
    const options = createCalendarOptions({
        userTimeZone: "America/Los_Angeles",
        onEventDrop() {},
        onDateClick() {},
        onDatesSet() {},
        onEventClick() {},
        onEventContextMenu() {},
    });
    const event = (priority, deadline) => ({
        extendedProps: { priority, deadline },
    });

    assert.ok(
        options.eventOrder(
            event("high", "2026-10-01T15:30:00.000Z"),
            event("low", "2026-10-01T14:30:00.000Z"),
        ) < 0,
    );
    assert.ok(
        options.eventOrder(
            event("medium", "2026-10-01T14:30:00.000Z"),
            event("medium", "2026-10-01T15:30:00.000Z"),
        ) < 0,
    );

    const content = options.eventContent({
        event: {
            title: "<Task>",
            extendedProps: {
                deadline: "2026-10-01T15:30:00.000Z",
                priority: "high",
            },
        },
    });

    assert.match(content.html, /8:30 am/);
    assert.match(content.html, /&lt;Task&gt;/);
    assert.match(content.html, /background:#ef4444/);
});
