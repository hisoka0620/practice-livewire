import { expect, test } from "@playwright/test";
import { signInAndOpenCalendar } from "./support/calendar";

test("syncs event tooltips with input changes and releases the listener", async ({
    page,
}) => {
    await page.addInitScript(() => {
        const media = "(hover: none) and (pointer: coarse)";
        const listeners = new Set<(event: MediaQueryListEvent) => void>();
        let isTouch = false;
        const controlledQuery = {
            media,
            get matches() {
                return isTouch;
            },
            addEventListener(_type: string, listener: EventListener) {
                if (typeof listener === "function") {
                    listeners.add(listener as (event: MediaQueryListEvent) => void);
                }
            },
            removeEventListener(_type: string, listener: EventListener) {
                listeners.delete(listener as (event: MediaQueryListEvent) => void);
            },
        } as unknown as MediaQueryList;
        const nativeMatchMedia = window.matchMedia.bind(window);

        window.matchMedia = ((query: string) =>
            query === media ? controlledQuery : nativeMatchMedia(query)) as typeof window.matchMedia;
        (window as any).__tooltipMedia = {
            setMatches(value: boolean) {
                isTouch = value;
                const event = { matches: value, media } as MediaQueryListEvent;
                listeners.forEach((listener) => listener(event));
            },
            get listenerCount() {
                return listeners.size;
            },
        };
    });

    await signInAndOpenCalendar(page);
    const event = page.locator("#task-calendar .fc-event").first();
    await expect(event).toBeVisible();
    await expect
        .poll(() => event.evaluate((element) => Boolean(element._tippy)))
        .toBe(true);
    await expect
        .poll(() =>
            page.evaluate(() => (window as any).__tooltipMedia.listenerCount),
        )
        .toBe(1);

    await page.evaluate(() => (window as any).__tooltipMedia.setMatches(true));
    await expect
        .poll(() => event.evaluate((element) => Boolean(element._tippy)))
        .toBe(false);

    await page.evaluate(() => (window as any).__tooltipMedia.setMatches(false));
    await expect
        .poll(() => event.evaluate((element) => Boolean(element._tippy)))
        .toBe(true);

    await page.getByRole("button", { name: "List", exact: true }).click();
    await expect(page.locator("#task-calendar")).toHaveCount(0);
    await expect
        .poll(() =>
            page.evaluate(() => (window as any).__tooltipMedia.listenerCount),
        )
        .toBe(0);
});

test("releases calendar listeners when its view is destroyed and recreated", async ({
    page,
}) => {
    await page.addInitScript(() => {
        const stats = { added: 0, removed: 0, active: new Set() };
        Object.defineProperty(window, "__calendarMouseDownStats", {
            value: stats,
        });

        const addEventListener = EventTarget.prototype.addEventListener;
        const removeEventListener = EventTarget.prototype.removeEventListener;
        const isCalendarListener = (
            target: EventTarget,
            type: string,
            options?: boolean | AddEventListenerOptions,
        ) =>
            target instanceof HTMLElement &&
            target.id === "task-calendar" &&
            type === "mousedown" &&
            options === true;

        EventTarget.prototype.addEventListener = function (
            type,
            listener,
            options,
        ) {
            if (isCalendarListener(this, type, options)) {
                stats.added++;
                stats.active.add(listener);
            }
            return addEventListener.call(this, type, listener, options);
        };
        EventTarget.prototype.removeEventListener = function (
            type,
            listener,
            options,
        ) {
            if (isCalendarListener(this, type, options)) {
                stats.removed++;
                stats.active.delete(listener);
            }
            return removeEventListener.call(this, type, listener, options);
        };
    });

    await signInAndOpenCalendar(page);
    await expect(
        page.locator('#task-calendar .fc-daygrid-day[data-date="2026-10-01"]'),
    ).toBeVisible();
    await expect
        .poll(() =>
            page.evaluate(
                () => (window as any).__calendarMouseDownStats.active.size,
            ),
        )
        .toBe(1);

    await page.getByRole("button", { name: "List", exact: true }).click();
    await expect(page.locator("#task-calendar")).toHaveCount(0);
    await expect
        .poll(() =>
            page.evaluate(
                () => (window as any).__calendarMouseDownStats.active.size,
            ),
        )
        .toBe(0);

    await page.getByRole("button", { name: "Calendar", exact: true }).click();
    await expect(
        page.locator('#task-calendar .fc-daygrid-day[data-date="2026-10-01"]'),
    ).toBeVisible();
    await expect
        .poll(() =>
            page.evaluate(() => (window as any).__calendarMouseDownStats),
        )
        .toMatchObject({ added: 2, removed: 1 });
});
