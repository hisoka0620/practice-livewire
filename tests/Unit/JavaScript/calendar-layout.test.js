import assert from "node:assert/strict";
import test from "node:test";
import {
    attachCalendarOverlay,
    createCalendarLayoutObserver,
} from "../../../resources/js/calendar/layout.js";

test("observes calendar layout and updates header height", () => {
    const originalResizeObserver = globalThis.ResizeObserver;
    const originalGetComputedStyle = globalThis.getComputedStyle;
    const toolbar = { offsetHeight: 36 };
    const observed = [];
    let onResize;
    let disconnected = false;
    let headerHeight;

    globalThis.ResizeObserver = class {
        constructor(callback) {
            onResize = callback;
        }

        observe(element) {
            observed.push(element);
        }

        disconnect() {
            disconnected = true;
        }
    };
    globalThis.getComputedStyle = () => ({ marginBottom: "4px" });

    try {
        const calendarEl = {
            querySelector: () => toolbar,
            style: {
                setProperty(name, value) {
                    assert.equal(name, "--fc-header-height");
                    headerHeight = value;
                },
            },
        };
        const observer = createCalendarLayoutObserver(calendarEl);

        assert.deepEqual(observed, [toolbar, calendarEl]);
        assert.equal(headerHeight, "40px");

        toolbar.offsetHeight = 42;
        onResize();
        assert.equal(headerHeight, "46px");

        observer.disconnect();
        assert.equal(disconnected, true);
    } finally {
        if (originalResizeObserver) {
            globalThis.ResizeObserver = originalResizeObserver;
        } else {
            delete globalThis.ResizeObserver;
        }
        if (originalGetComputedStyle) {
            globalThis.getComputedStyle = originalGetComputedStyle;
        } else {
            delete globalThis.getComputedStyle;
        }
    }
});

test("attaches the overlay to the current view harness only once", () => {
    let appendCount = 0;
    const harness = {
        appendChild(overlay) {
            appendCount++;
            overlay.parentElement = harness;
        },
    };
    const overlay = { parentElement: null };
    const calendarEl = {
        querySelector: () => harness,
    };

    attachCalendarOverlay(calendarEl, overlay);
    attachCalendarOverlay(calendarEl, overlay);

    assert.equal(overlay.parentElement, harness);
    assert.equal(appendCount, 1);
});
