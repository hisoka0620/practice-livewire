import assert from "node:assert/strict";
import test from "node:test";
import { processEventsByView } from "../../../resources/js/calendar/event-utils.js";

test("converts month events to all-day events without mutating input", () => {
    const event = {
        id: "1",
        start: "2026-10-01T15:30:00.000Z",
        end: "2026-10-01T16:30:00.000Z",
        allDay: false,
    };

    const result = processEventsByView([event], "dayGridMonth");

    assert.deepEqual(result[0], {
        ...event,
        allDay: true,
        end: null,
    });
    assert.equal(typeof result[0].start, "string");
    assert.notEqual(result[0], event);
    assert.equal(event.end, "2026-10-01T16:30:00.000Z");
    assert.equal(event.allDay, false);
});

test("converts weekly event starts to Dates without mutating input", () => {
    const event = {
        id: "1",
        start: "2026-10-01T15:30:00.000Z",
        end: "2026-10-01T16:30:00.000Z",
        allDay: true,
    };

    const result = processEventsByView([event], "timeGridWeek");

    assert.equal(result[0].start.toISOString(), event.start);
    assert.equal(result[0].allDay, false);
    assert.equal(result[0].end, null);
    assert.notEqual(result[0], event);
    assert.equal(event.start, "2026-10-01T15:30:00.000Z");
    assert.equal(event.end, "2026-10-01T16:30:00.000Z");
    assert.equal(event.allDay, true);
});

test("leaves events unchanged for an unknown view", () => {
    const event = { id: "1", start: "2026-10-01" };
    const events = [event];

    const result = processEventsByView(events, "listWeek");

    assert.notEqual(result, events);
    assert.equal(result[0], event);
});

test("returns an empty event array unchanged", () => {
    const events = [];

    assert.equal(processEventsByView(events, "dayGridMonth"), events);
});

test("leaves weekly events without a start unchanged", () => {
    const event = { id: "1", allDay: true };

    const result = processEventsByView([event], "timeGridWeek");

    assert.equal(result[0], event);
});
