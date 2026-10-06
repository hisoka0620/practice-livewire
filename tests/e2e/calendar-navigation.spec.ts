import { expect, test } from "@playwright/test";
import { signInAndOpenCalendar } from "./support/calendar";

test("keeps calendar controls usable across viewport widths", async ({
    page,
}) => {
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

        expect(layout.horizontalOverflow, `viewport width ${width}`).toBe(
            false,
        );
        expect(layout.controlsOverflow, `viewport width ${width}`).toBe(false);
        expect(layout.controlsOverlap, `viewport width ${width}`).toBe(false);
        expect(layout.toolbarOverflow, `viewport width ${width}`).toBe(false);
        expect(layout.toolbarOverlap, `viewport width ${width}`).toBe(false);
    }
});

test("fits a six-week month on mobile and preserves desktop sizing", async ({
    page,
}) => {
    await page.clock.install({
        time: new Date("2026-08-01T12:00:00-07:00"),
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await signInAndOpenCalendar(page);

    const dayCells = page.locator("#task-calendar .fc-daygrid-day");
    await expect(dayCells).toHaveCount(42);
    await expect(
        page.locator('#task-calendar [data-date="2026-08-01"]'),
    ).toBeVisible();
    await expect(
        page.locator('#task-calendar [data-date="2026-08-31"]'),
    ).toBeVisible();

    const mobileSize = await page.evaluate(() => {
        const container = document.querySelector("#calendar-container");
        const cell = document.querySelector(
            "#task-calendar .fc-daygrid-day-frame",
        );
        const cells = Array.from(
            document.querySelectorAll("#task-calendar .fc-daygrid-day"),
        );
        const containerBounds = container.getBoundingClientRect();
        const gridBottom = Math.max(
            ...cells.map((day) => day.getBoundingClientRect().bottom),
        );

        return {
            containerHeight: containerBounds.height,
            minCellHeight: getComputedStyle(cell).minHeight,
            gridBottom,
            containerBottom: containerBounds.bottom,
        };
    });

    expect(mobileSize.containerHeight).toBeLessThan(600);
    expect(mobileSize.minCellHeight).toBe("64px");
    expect(mobileSize.gridBottom).toBeLessThanOrEqual(
        mobileSize.containerBottom + 1,
    );

    await page.locator(".fc-next-button").click();
    await page.locator(".fc-next-button").click();
    const event = page
        .locator(
            '#task-calendar .fc-daygrid-day[data-date="2026-10-01"] .fc-event',
        )
        .filter({ hasText: "Timezone boundary task" });
    await expect(event).toBeVisible();

    for (const width of [320, 390]) {
        await page.setViewportSize({ width, height: 844 });
        await expect(event).toBeVisible();
        await page.screenshot({
            path: `test-results/calendar-responsive-${width}.png`,
            fullPage: true,
        });

        await event.locator(".fc-event-title").click();
        const editDialog = page.getByRole("dialog");
        await expect(editDialog.getByLabel("Title")).toHaveValue(
            "Timezone boundary task",
        );
        await editDialog.getByRole("button", { name: "Close modal" }).click();
    }

    await page.setViewportSize({ width: 1280, height: 900 });
    const desktopSize = await page.evaluate(() => ({
        containerHeight: document
            .querySelector("#calendar-container")
            .getBoundingClientRect().height,
        minCellHeight: getComputedStyle(
            document.querySelector("#task-calendar .fc-daygrid-day-frame"),
        ).minHeight,
    }));

    expect(desktopSize.containerHeight).toBe(860);
    expect(desktopSize.minCellHeight).toBe("120px");
});

test("keeps dense mobile month events reachable through the more popover", async ({
    page,
}) => {
    await page.clock.install({
        time: new Date("2026-10-01T12:00:00-07:00"),
    });
    await page.setViewportSize({ width: 320, height: 844 });
    await signInAndOpenCalendar(page);

    for (const title of [
        "Readable mobile event one",
        "Readable mobile event two",
        "Readable mobile event three",
    ]) {
        await page.getByRole("button", { name: "Create Task" }).click();
        const dialog = page.getByRole("dialog");
        await dialog.getByLabel("Title").fill(title);
        await dialog.getByLabel("Deadline").fill("2026-10-01T10:00");
        const creation = page.waitForResponse((response) =>
            response.url().includes("/livewire/update"),
        );
        await dialog.getByRole("button", { name: "Create" }).click();
        await creation;
        await expect(dialog).toBeHidden();
    }

    const day = page.locator(
        '#task-calendar .fc-daygrid-day[data-date="2026-10-01"]',
    );
    const moreLink = day.locator(".fc-daygrid-more-link");
    await expect(moreLink).toBeVisible();
    await moreLink.click();

    const popover = page.locator("#task-calendar .fc-popover");
    await expect(popover).toBeVisible();
    await expect(popover).toContainText("Readable mobile event one");
    await expect(popover).toContainText("Readable mobile event two");
    await expect(popover).toContainText("Readable mobile event three");

    const bounds = await popover.evaluate((element) => {
        const { left, right } = element.getBoundingClientRect();
        return { left, right, viewportWidth: window.innerWidth };
    });
    expect(bounds.left).toBeGreaterThanOrEqual(0);
    expect(bounds.right).toBeLessThanOrEqual(bounds.viewportWidth + 1);
    expect(
        await page.evaluate(
            () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
    ).toBe(true);
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
