import { expect, test } from "@playwright/test";
import { signInAndOpenCalendar } from "./support/calendar";

test("keeps calendar controls usable across viewport widths", async ({ page }) => {
    await signInAndOpenCalendar(page);

    const calendar = page.locator("#task-calendar .fc-daygrid");

    for (const width of [320, 390, 768, 1280]) {
        await page.setViewportSize({ width, height: 900 });
        await expect(calendar).toBeVisible();

        const layout = await page.evaluate(() => {
            const intersects = (first, second) =>
                first.left < second.right - 1 &&
                first.right > second.left + 1 &&
                first.top < second.bottom - 1 &&
                first.bottom > second.top + 1;
            const rect = (element) => {
                const { left, right, top, bottom } =
                    element.getBoundingClientRect();
                return { left, right, top, bottom };
            };
            const controls = document.querySelector("#calendar-controls");
            const controlElements = Array.from(controls.children).flatMap(
                (element, index) =>
                    index === 1 ? Array.from(element.children) : [element],
            );
            const controlBounds = rect(controls);
            const controlRects = controlElements
                .filter((element) => element.getClientRects().length > 0)
                .map(rect);
            const toolbar = document.querySelector(
                "#task-calendar .fc-toolbar",
            );
            const toolbarChunks = Array.from(
                toolbar.querySelectorAll(":scope > .fc-toolbar-chunk"),
            ).map(rect);

            return {
                horizontalOverflow:
                    document.documentElement.scrollWidth > window.innerWidth,
                controlsOverflow: controlRects.some(
                    (box) =>
                        box.left < controlBounds.left ||
                        box.right > controlBounds.right,
                ),
                controlsOverlap: controlRects.some((box, index) =>
                    controlRects
                        .slice(index + 1)
                        .some((other) => intersects(box, other)),
                ),
                toolbarOverflow: toolbar.scrollWidth > toolbar.clientWidth,
                toolbarOverlap: toolbarChunks.some((box, index) =>
                    toolbarChunks
                        .slice(index + 1)
                        .some((other) => intersects(box, other)),
                ),
            };
        });

        expect(layout.horizontalOverflow, `viewport width ${width}`).toBe(false);
        expect(layout.controlsOverflow, `viewport width ${width}`).toBe(false);
        expect(layout.controlsOverlap, `viewport width ${width}`).toBe(false);
        expect(layout.toolbarOverflow, `viewport width ${width}`).toBe(false);
        expect(layout.toolbarOverlap, `viewport width ${width}`).toBe(false);
    }
});

test("keeps the date picker synchronized across calendar views and jumps", async ({
    page,
}) => {
    await page.clock.install({
        time: new Date("2026-10-01T12:00:00-07:00"),
    });
    await signInAndOpenCalendar(page);

    const datePicker = page.locator(
        'input[type="text"][placeholder="Select Date.."]',
    );
    await expect(datePicker).toHaveValue("October 2026");

    await page.locator(".fc-timeGridWeek-button").click();
    await expect(page.locator(".fc-timegrid")).toBeVisible();
    await expect(datePicker).toHaveValue("October 1, 2026");

    await page.locator(".fc-next-button").click();
    await expect(datePicker).toHaveValue("October 4, 2026");
    await page.locator(".fc-today-button").click();
    await expect(datePicker).toHaveValue("September 27, 2026");

    await page.locator(".fc-dayGridMonth-button").click();
    await expect(page.locator(".fc-daygrid")).toBeVisible();
    await expect(datePicker).toHaveValue("October 2026");

    await datePicker.click();
    await page
        .locator(".flatpickr-monthSelect-month")
        .filter({ hasText: "Nov" })
        .click();
    await expect(page.locator(".fc-toolbar-title")).toHaveText("November 2026");
    await expect(datePicker).toHaveValue("November 2026");

    await page.locator(".fc-timeGridWeek-button").click();
    await expect(datePicker).toHaveValue("November 1, 2026");
    await datePicker.click();
    await page
        .locator('.flatpickr-day[aria-label="November 15, 2026"]')
        .click();
    await expect(page.locator(".fc-toolbar-title")).toContainText("15");
    await expect(datePicker).toHaveValue("November 15, 2026");
});
