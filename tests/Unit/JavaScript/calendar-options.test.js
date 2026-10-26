import assert from "node:assert/strict";
import test from "node:test";
import {
    createCalendarOptions,
    createEventTooltipController,
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

function createMediaQuery(matches) {
    const listeners = new Set();

    return {
        matches,
        addEventListener(_type, listener) {
            listeners.add(listener);
        },
        removeEventListener(_type, listener) {
            listeners.delete(listener);
        },
        setMatches(value) {
            this.matches = value;
            listeners.forEach((listener) => listener({ matches: value }));
        },
        get listenerCount() {
            return listeners.size;
        },
    };
}

function createTooltipEvent() {
    return {
        el: {},
        event: {
            title: "Tooltip test task",
            extendedProps: {
                deadline: "2026-10-01T15:30:00.000Z",
                priority: "high",
                status: "incomplete",
            },
        },
    };
}

test("syncs mounted event tooltips as the input environment changes", () => {
    const mediaQuery = createMediaQuery(false);
    const tooltipCalls = [];
    const controller = createEventTooltipController({
        userTimeZone: "America/Los_Angeles",
        windowRef: {
            matchMedia(query) {
                assert.equal(query, "(hover: none) and (pointer: coarse)");
                return mediaQuery;
            },
        },
        createTippy(element) {
            const instance = {
                destroyCount: 0,
                destroy() {
                    this.destroyCount++;
                },
            };
            tooltipCalls.push({ element, instance });
            return instance;
        },
    });
    const eventInfo = createTooltipEvent();

    controller.mount(eventInfo);
    controller.mount(eventInfo);
    assert.equal(tooltipCalls.length, 1);
    assert.ok(eventInfo.el._tippy);

    mediaQuery.setMatches(true);
    assert.equal(tooltipCalls[0].instance.destroyCount, 1);
    assert.equal(eventInfo.el._tippy, undefined);

    const eventAddedOnTouch = createTooltipEvent();
    controller.mount(eventAddedOnTouch);
    assert.equal(tooltipCalls.length, 1);
    assert.equal(eventAddedOnTouch.el._tippy, undefined);

    mediaQuery.setMatches(false);
    assert.equal(tooltipCalls.length, 3);
    assert.ok(eventInfo.el._tippy);
    assert.ok(eventAddedOnTouch.el._tippy);

    controller.unmount(eventInfo);
    assert.equal(tooltipCalls[1].instance.destroyCount, 1);
    assert.equal(eventInfo.el._tippy, undefined);

    controller.destroy();
    assert.equal(tooltipCalls[2].instance.destroyCount, 1);
    assert.equal(eventAddedOnTouch.el._tippy, undefined);
    assert.equal(mediaQuery.listenerCount, 0);
});

test("removes input listeners on destroy and falls back without matchMedia", () => {
    const mediaQuery = createMediaQuery(true);
    const controller = createEventTooltipController({
        userTimeZone: "America/Los_Angeles",
        windowRef: { matchMedia: () => mediaQuery },
        createTippy() {
            assert.fail("touch-first input should not create a tooltip");
        },
    });

    assert.equal(mediaQuery.listenerCount, 1);
    controller.destroy();
    assert.equal(mediaQuery.listenerCount, 0);

    let fallbackCreated = false;
    const fallbackController = createEventTooltipController({
        userTimeZone: "America/Los_Angeles",
        windowRef: {},
        createTippy(element) {
            fallbackCreated = true;
            return { destroy() { delete element._tippy; } };
        },
    });
    const eventInfo = createTooltipEvent();
    fallbackController.mount(eventInfo);
    assert.equal(fallbackCreated, true);
    fallbackController.destroy();
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

// FullCalendar renders string content as escaped text, so any markup must be
// returned via the { html: ... } object form for the media query to apply.
test("returns more link content as an HTML object, not escaped text", () => {
    const options = createCalendarOptions({
        userTimeZone: "America/Los_Angeles",
        onEventDrop() {},
        onDateClick() {},
        onDatesSet() {},
        onEventClick() {},
        onEventContextMenu() {},
    });

    const content = options.moreLinkContent({ num: 5 });

    assert.equal(typeof content, "object");
    assert.equal(
        content.html,
        '+5<span class="fc-more-link-label"> more</span>',
    );
});
