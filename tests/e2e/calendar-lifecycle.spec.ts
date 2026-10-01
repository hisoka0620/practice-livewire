import { expect, test } from "@playwright/test";
import { signInAndOpenCalendar } from "./support/calendar";

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
