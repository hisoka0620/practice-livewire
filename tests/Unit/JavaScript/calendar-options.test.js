import assert from "node:assert/strict";
import test from "node:test";
import {
    createCalendarOptions,
    getCalendarHeight,
    getDayHeaderFormat,
    getDayMaxEvents,
} from "../../../resources/js/calendar/options.js";

test("caps month events on narrow or short screens", () => {
    assert.equal(getDayMaxEvents(639, 900), 2);
    assert.equal(getDayMaxEvents(640, 640), 2);
    assert.equal(getDayMaxEvents(1200, 640), 2);
    assert.equal(getDayMaxEvents(640, 641), true);
});

test("uses auto calendar height only on short screens", () => {
    assert.equal(getCalendarHeight(640), "auto");
    assert.equal(getCalendarHeight(641), "100%");
});

test("uses narrow weekday labels at widths up to 375px", () => {
    assert.deepEqual(getDayHeaderFormat(375), { weekday: "narrow" });
    assert.deepEqual(getDayHeaderFormat(376), { weekday: "short" });
});

test("uses the shared screen rule for initial calendar options", () => {
    const previousWindow = globalThis.window;
    globalThis.window = { innerWidth: 1200, innerHeight: 640 };

    const options = createCalendarOptions({
        userTimeZone: "America/Los_Angeles",
        onEventDrop() {},
        onDateClick() {},
        onDatesSet() {},
        onEventClick() {},
        onEventContextMenu() {},
    });

    if (previousWindow === undefined) {
        delete globalThis.window;
    } else {
        globalThis.window = previousWindow;
    }

    assert.equal(options.dayMaxEvents, 2);
    assert.equal(options.height, "auto");
    assert.deepEqual(options.dayHeaderFormat, { weekday: "short" });
});

test("uses narrow weekday labels in initial options on narrow screens", () => {
    const previousWindow = globalThis.window;
    globalThis.window = { innerWidth: 375, innerHeight: 768 };

    const options = createCalendarOptions({
        userTimeZone: "America/Los_Angeles",
        onEventDrop() {},
        onDateClick() {},
        onDatesSet() {},
        onEventClick() {},
        onEventContextMenu() {},
    });

    if (previousWindow === undefined) {
        delete globalThis.window;
    } else {
        globalThis.window = previousWindow;
    }

    assert.deepEqual(options.dayHeaderFormat, { weekday: "narrow" });
});

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
