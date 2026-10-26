import { expect, test } from "@playwright/test";
import { signInAndOpenCalendar } from "./support/calendar";

test("keeps calendar controls usable across viewport widths", async ({
    page,
}) => {
    await signInAndOpenCalendar(page);

    const calendar = page.locator("#task-calendar .fc-daygrid");

    const minimumDayCellWidths = new Map([
        [320, 40],
        [390, 49],
        [640, 75],
        [768, 90],
        [1280, 125],
    ]);

    for (const width of minimumDayCellWidths.keys()) {
        await page.setViewportSize({ width, height: 900 });
        await expect(calendar).toBeVisible();
        await expect
            .poll(() =>
                page
                    .locator("#task-calendar .fc-daygrid-day")
                    .first()
                    .evaluate((cell) => cell.getBoundingClientRect().width),
            )
            .toBeGreaterThanOrEqual(minimumDayCellWidths.get(width));

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
                dayCellWidth: document
                    .querySelector("#task-calendar .fc-daygrid-day")
                    .getBoundingClientRect().width,
            };
        });

        expect(layout.horizontalOverflow, `viewport width ${width}`).toBe(
            false,
        );
        expect(layout.controlsOverflow, `viewport width ${width}`).toBe(false);
        expect(layout.controlsOverlap, `viewport width ${width}`).toBe(false);
        expect(layout.toolbarOverflow, `viewport width ${width}`).toBe(false);
        expect(layout.toolbarOverlap, `viewport width ${width}`).toBe(false);
        expect(
            layout.dayCellWidth,
            `day cell width at ${width}px`,
        ).toBeGreaterThanOrEqual(minimumDayCellWidths.get(width));
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

test("adapts calendar density to short viewports without clipping the month", async ({
    page,
}) => {
    await page.clock.install({
        time: new Date("2026-08-01T12:00:00-07:00"),
    });
    await signInAndOpenCalendar(page);

    const dayCells = page.locator("#task-calendar .fc-daygrid-day");
    const toolbar = page.locator("#task-calendar .fc-toolbar");
    const container = page.locator("#calendar-container");

    for (const viewport of [
        {
            width: 844,
            height: 390,
            expectedCellHeight: "64px",
        },
        {
            width: 1024,
            height: 600,
            expectedCellHeight: "64px",
        },
        {
            width: 1280,
            height: 900,
            expectedCellHeight: "120px",
        },
    ]) {
        await page.setViewportSize({
            width: viewport.width,
            height: viewport.height,
        });
        await expect(dayCells).toHaveCount(42);
        await expect(toolbar).toBeVisible();
        await expect(
            page.locator('#task-calendar [data-date="2026-08-31"]'),
        ).toBeVisible();

        const layout = await page.evaluate(() => {
            const calendarContainer = document.querySelector(
                "#calendar-container",
            );
            const calendar = document.querySelector("#task-calendar");
            const toolbarElement = document.querySelector(
                "#task-calendar .fc-toolbar",
            );
            const grid = document.querySelector("#task-calendar .fc-daygrid");
            const dayFrame = document.querySelector(
                "#task-calendar .fc-daygrid-day-frame",
            );
            const containerBounds = calendarContainer.getBoundingClientRect();
            const gridBounds = grid.getBoundingClientRect();

            return {
                containerHeight: containerBounds.height,
                cellMinHeight: getComputedStyle(dayFrame).minHeight,
                gridFitsContainer:
                    gridBounds.bottom <= containerBounds.bottom + 1,
                toolbarFitsCalendar:
                    toolbarElement.scrollWidth <= toolbarElement.clientWidth,
                calendarFitsContainer:
                    calendar.scrollWidth <= calendar.clientWidth,
                horizontalOverflow:
                    document.documentElement.scrollWidth > window.innerWidth,
                pageCanScroll:
                    document.documentElement.scrollHeight > window.innerHeight,
                calendarHeight: Alpine.$data(
                    document.querySelector('[x-data="taskCalendar($wire)"]'),
                ).calendar.getOption("height"),
                internalVerticalOverflow: Array.from(
                    calendar.querySelectorAll(".fc-scroller"),
                ).some((scroller) =>
                    scroller.scrollHeight > scroller.clientHeight + 1,
                ),
            };
        });

        expect(layout.cellMinHeight).toBe(viewport.expectedCellHeight);
        expect(layout.gridFitsContainer).toBe(true);
        expect(layout.toolbarFitsCalendar).toBe(true);
        expect(layout.calendarFitsContainer).toBe(true);
        expect(layout.horizontalOverflow).toBe(false);

        if (viewport.height <= 640) {
            expect(layout.calendarHeight).toBe("auto");
            expect(layout.internalVerticalOverflow).toBe(false);
            expect(layout.pageCanScroll).toBe(true);
            await page
                .locator('#task-calendar [data-date="2026-08-31"]')
                .scrollIntoViewIfNeeded();
            await expect(
                page.locator('#task-calendar [data-date="2026-08-31"]'),
            ).toBeInViewport();
        } else {
            expect(layout.calendarHeight).toBe("100%");
            expect(layout.containerHeight).toBe(860);
        }
    }

    const getCalendarHeight = () =>
        page.evaluate(() =>
            Alpine.$data(
                document.querySelector('[x-data="taskCalendar($wire)"]'),
            ).calendar.getOption("height"),
        );

    await page.setViewportSize({ width: 1280, height: 640 });
    await expect.poll(getCalendarHeight).toBe("auto");
    await expect
        .poll(() =>
            page.locator("#task-calendar .fc-scroller").evaluateAll((elements) =>
                elements.some(
                    (element) =>
                        element.scrollHeight > element.clientHeight + 1,
                ),
            ),
        )
        .toBe(false);

    await page.setViewportSize({ width: 1280, height: 641 });
    await expect.poll(getCalendarHeight).toBe("100%");
    await expect
        .poll(() =>
            page.locator("#calendar-container").evaluate(
                (element) => element.getBoundingClientRect().height,
            ),
        )
        .toBe(860);

    await page.setViewportSize({ width: 1280, height: 640 });
    await expect.poll(getCalendarHeight).toBe("auto");
    await expect
        .poll(() =>
            page.locator("#task-calendar .fc-scroller").evaluateAll((elements) =>
                elements.some(
                    (element) =>
                        element.scrollHeight > element.clientHeight + 1,
                ),
            ),
        )
        .toBe(false);
});

test("keeps mobile event titles on one line and preserves the full edit value", async ({
    page,
}) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.clock.install({
        time: new Date("2026-10-01T12:00:00-07:00"),
    });
    await signInAndOpenCalendar(page);

    const title =
        "A deliberately long mobile calendar title that should be truncated to one visible line";
    await page.getByRole("button", { name: "Create Task" }).click();
    const createDialog = page.getByRole("dialog");
    await createDialog.getByLabel("Title").fill(title);
    await createDialog.getByLabel("Deadline").fill("2026-10-20T10:00");
    const creation = page.waitForResponse((response) =>
        response.url().includes("/livewire/update"),
    );
    await createDialog.getByRole("button", { name: "Create" }).click();
    await creation;
    await expect(createDialog).toBeHidden();

    const event = page
        .locator('#task-calendar [data-date="2026-10-20"] .fc-event')
        .filter({ hasText: title });
    await expect(event).toBeVisible();
    const eventTitle = event.locator(".fc-event-title");
    for (const width of [320, 390, 639]) {
        await page.setViewportSize({ width, height: 844 });
        const titleLayout = await eventTitle.evaluate((element) => {
            const style = getComputedStyle(element);
            const customEvent = element.closest(".fc-custom-event");
            const priority = customEvent?.querySelector(".fc-priority-dot");
            const actions = element
                .closest(".fc-custom-event")
                .querySelector(".fc-event-actions-trigger");
            const chip = element.closest(".fc-daygrid-event");
            const chipLeft = chip?.getBoundingClientRect().left;
            const strap = priority?.getBoundingClientRect();

            return {
                whiteSpace: style.whiteSpace,
                textOverflow: style.textOverflow,
                priorityDisplay: priority
                    ? getComputedStyle(priority).display
                    : "none",
                lineHeight: Number.parseFloat(style.lineHeight),
                height: element.getBoundingClientRect().height,
                titleWidth: element.clientWidth,
                titleScrollWidth: element.scrollWidth,
                badgeCount: element
                    .closest(".fc-custom-event")
                    .querySelectorAll(".fc-priority-badge").length,
                actionsDisplay: getComputedStyle(actions).display,
                chipLeft,
                strapLeft: strap?.left,
                strapRight: strap?.right,
                titleLeft: element.getBoundingClientRect().left,
            };
        });

        expect(titleLayout.whiteSpace, `title at ${width}px`).toBe("nowrap");
        expect(titleLayout.textOverflow).toBe("ellipsis");
        expect(titleLayout.priorityDisplay).not.toBe("none");
        expect(titleLayout.height).toBeLessThanOrEqual(
            titleLayout.lineHeight + 2.5,
        );
        expect(titleLayout.titleScrollWidth).toBeGreaterThan(
            titleLayout.titleWidth,
        );
        expect(titleLayout.badgeCount).toBe(0);
        // The in-cell ⋮ is hidden below 480px and always shown in the 480-639px band
        if (width <= 479) {
            expect(titleLayout.actionsDisplay).toBe("none");
            // The strap hugs the chip's left edge (chip border aside) ...
            expect(
                titleLayout.chipLeft - titleLayout.strapLeft,
                `strap offset at ${width}px`,
            ).toBeLessThan(1.5);
            // ... and the title starts right after it with no blank column
            expect(
                titleLayout.titleLeft - titleLayout.strapRight,
                `title gap after strap at ${width}px`,
            ).toBeLessThan(2.5);
        } else {
            expect(titleLayout.actionsDisplay).not.toBe("none");
        }
    }

    await eventTitle.click();
    const editDialog = page.getByRole("dialog");
    await expect(editDialog.getByLabel("Title")).toHaveValue(title);
});

test("preserves event title space at intermediate widths", async ({ page }) => {
    await page.clock.install({
        time: new Date("2026-10-01T12:00:00-07:00"),
    });
    await signInAndOpenCalendar(page);

    const shortTitle = "Planning";
    const longTitle =
        "A long calendar title for intermediate widths that should truncate without covering event controls";

    for (const title of [shortTitle, longTitle]) {
        await page.getByRole("button", { name: "Create Task" }).click();
        const dialog = page.getByRole("dialog");
        await dialog.getByLabel("Title").fill(title);
        await dialog.getByLabel("Deadline").fill("2026-10-20T10:00");
        const creation = page.waitForResponse((response) =>
            response.url().includes("/livewire/update"),
        );
        await dialog.getByRole("button", { name: "Create" }).click();
        await creation;
        await expect(dialog).toBeHidden();
    }

    const day = page.locator('#task-calendar [data-date="2026-10-20"]');
    const shortEvent = day.locator(".fc-event").filter({ hasText: shortTitle });
    const longEvent = day.locator(".fc-event").filter({ hasText: longTitle });

    for (const width of [640, 768, 900]) {
        await page.setViewportSize({ width, height: 900 });

        for (const event of [shortEvent, longEvent]) {
            await expect(event).toBeVisible();
            const layout = await event.evaluate((element) => {
                const title = element.querySelector(".fc-event-title");
                const priority = element.querySelector(".fc-priority-dot");
                const actions = element.querySelector(
                    ".fc-event-actions-trigger",
                );
                const time = element.querySelector(".fc-event-time");
                const bounds = (node) => node.getBoundingClientRect();
                const intersects = (first, second) =>
                    first.left < second.right - 1 &&
                    first.right > second.left + 1 &&
                    first.top < second.bottom - 1 &&
                    first.bottom > second.top + 1;

                return {
                    titleWidth: title.clientWidth,
                    titleScrollWidth: title.scrollWidth,
                    titleTextOverflow: getComputedStyle(title).textOverflow,
                    titlePriorityOverlap: intersects(
                        bounds(title),
                        bounds(priority),
                    ),
                    titleActionsOverlap: intersects(
                        bounds(title),
                        bounds(actions),
                    ),
                    badgeCount:
                        element.querySelectorAll(".fc-priority-badge").length,
                    priorityDisplay: getComputedStyle(priority).display,
                    actionsDisplay: getComputedStyle(actions).display,
                    timeDisplay: getComputedStyle(time).display,
                };
            });

            expect(
                layout.titleWidth,
                `title width at ${width}px`,
            ).toBeGreaterThanOrEqual(30);
            expect(layout.titlePriorityOverlap).toBe(false);
            expect(layout.titleActionsOverlap).toBe(false);
            expect(layout.badgeCount).toBe(0);
            expect(layout.priorityDisplay).not.toBe("none");
            expect(layout.actionsDisplay).not.toBe("none");
            expect(layout.timeDisplay).toBe("none");

            if (event === longEvent) {
                expect(layout.titleScrollWidth).toBeGreaterThan(
                    layout.titleWidth,
                );
                expect(layout.titleTextOverflow).toBe("ellipsis");
            }
        }
    }

    await page.setViewportSize({ width: 640, height: 900 });
    await longEvent.hover();
    await expect(longEvent.locator(".fc-event-actions-trigger")).toHaveCSS(
        "opacity",
        "1",
    );

    await page.setViewportSize({ width: 1280, height: 900 });
    await expect(longEvent.locator(".fc-event-time")).not.toHaveCSS(
        "display",
        "none",
    );
    await longEvent.hover();
    await expect(longEvent.locator(".fc-event-time")).toBeVisible();
    await expect(longEvent.locator(".fc-event-title")).toHaveText(longTitle);
    await expect(longEvent.locator(".fc-event-actions-trigger")).toHaveCSS(
        "opacity",
        "1",
    );

    const desktopLayout = await longEvent.evaluate((element) => {
        const title = element.querySelector(".fc-event-title");
        const priority = element.querySelector(".fc-priority-dot");
        const actions = element.querySelector(".fc-event-actions-trigger");
        const bounds = (node) => node.getBoundingClientRect();
        const intersects = (first, second) =>
            first.left < second.right - 1 &&
            first.right > second.left + 1 &&
            first.top < second.bottom - 1 &&
            first.bottom > second.top + 1;

        return {
            titleWidth: title.clientWidth,
            titlePriorityOverlap: intersects(bounds(title), bounds(priority)),
            titleActionsOverlap: intersects(bounds(title), bounds(actions)),
        };
    });
    expect(desktopLayout.titlePriorityOverlap).toBe(false);
    expect(desktopLayout.titleActionsOverlap).toBe(false);

    await longEvent.locator(".fc-event-title").click();
    await expect(page.getByRole("dialog").getByLabel("Title")).toHaveValue(
        longTitle,
    );
});

test.describe("dense mobile month calendar", () => {
    test.use({
        viewport: { width: 320, height: 844 },
        isMobile: true,
        hasTouch: true,
    });

    test("keeps all events reachable through the scrollable more popover", async ({
        page,
    }) => {
        await page.clock.install({
            time: new Date("2026-10-01T12:00:00-07:00"),
        });
        await signInAndOpenCalendar(page);

        const longTitle =
            "A deliberately long mobile calendar event title that should truncate on one visible line";
        const titles = [
            "Dense mobile event one",
            "Dense mobile event two",
            "Dense mobile event three",
            "Dense mobile event four",
            "Dense mobile event five",
            "Dense mobile event six",
            "Dense mobile event seven",
            "Dense mobile event eight",
            "Dense mobile event nine",
            "Dense mobile event ten",
            "Dense mobile event eleven",
            "Dense mobile event twelve",
            "Dense mobile event thirteen",
            "Dense mobile event fourteen",
            "Dense mobile event fifteen",
            "Dense mobile event sixteen",
            "Dense mobile event seventeen",
            "Dense mobile event eighteen",
            longTitle,
        ];

        for (const title of titles) {
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

        for (const width of [320, 390]) {
            await page.setViewportSize({ width, height: 844 });
            const visibleEvent = day.locator(".fc-event:visible").first();
            await expect(visibleEvent).toBeVisible();
            await expect(page.locator(".fc-priority-badge")).toHaveCount(0);
            await expect(moreLink).toBeVisible();

            // The " more" label must be a real <span> (string content is escaped
            // text for FullCalendar, so the HTML form is required), and a media
            // query hides it below 425px to keep "+N" inside the cell
            const moreLinkHtml = await moreLink.evaluate(
                (link) => link.innerHTML,
            );
            expect(moreLinkHtml).toContain("<span");
            expect(moreLinkHtml).not.toContain("&lt;");
            const labelDisplay = await moreLink
                .locator(".fc-more-link-label")
                .evaluate((label) => getComputedStyle(label).display);
            expect(labelDisplay, `label at ${width}px`).toBe("none");

            // The "+N more" link must stay inside its day cell (a ~40-44px cell
            // cannot fit the full label, which would bleed over the next cell)
            const dayRect = await day.boundingBox();
            const moreRect = await moreLink.boundingBox();
            expect(
                moreRect.x + moreRect.width,
                `more-link right edge at ${width}px`,
            ).toBeLessThanOrEqual(dayRect.x + dayRect.width + 1);
        }

        const visibleEvent = day.locator(".fc-event:visible").first();
        await visibleEvent.locator(".fc-event-title").click();
        const editDialog = page.getByRole("dialog");
        await expect(editDialog).toBeVisible();
        await editDialog.getByRole("button", { name: "Close modal" }).click();

        await moreLink.click();

        const popover = page.locator("#task-calendar .fc-popover");
        await expect(popover).toBeVisible();
        await expect(page.locator(".fc-priority-badge")).toHaveCount(0);
        const popoverEvents = popover.locator(".fc-daygrid-event");
        expect(await popoverEvents.count()).toBeGreaterThanOrEqual(
            titles.length,
        );
        for (const event of await popoverEvents.all()) {
            // The bottom-sheet popover has enough row width to show both the dot and the ⋮
            await expect(event.locator(".fc-priority-dot")).toBeVisible();
            await expect(
                event.locator(".fc-event-actions-trigger"),
            ).toBeVisible();
        }
        for (const title of titles) {
            await expect(popover).toContainText(title);
        }

        const popoverBody = popover.locator(".fc-popover-body");
        const scrollMetrics = await popoverBody.evaluate((element) => ({
            clientHeight: element.clientHeight,
            scrollHeight: element.scrollHeight,
        }));
        expect(scrollMetrics.scrollHeight).toBeGreaterThan(
            scrollMetrics.clientHeight,
        );
        await popoverBody.evaluate((element) => {
            element.scrollTop = element.scrollHeight;
        });
        await expect(
            popover.getByText(longTitle, { exact: true }),
        ).toBeVisible();

        const longTitleLayout = await popover
            .getByText(longTitle, { exact: true })
            .evaluate((element) => {
                const style = getComputedStyle(element);
                return {
                    clientHeight: element.clientHeight,
                    scrollHeight: element.scrollHeight,
                    clientWidth: element.clientWidth,
                    scrollWidth: element.scrollWidth,
                    whiteSpace: style.whiteSpace,
                    textOverflow: style.textOverflow,
                };
            });
        expect(longTitleLayout.scrollHeight).toBeLessThanOrEqual(
            longTitleLayout.clientHeight + 1,
        );
        expect(longTitleLayout.whiteSpace).toBe("nowrap");
        expect(longTitleLayout.textOverflow).toBe("ellipsis");
        expect(longTitleLayout.scrollWidth).toBeGreaterThan(
            longTitleLayout.clientWidth,
        );

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

        await popover.getByText(longTitle, { exact: true }).tap();
        const taskDialog = page.getByRole("dialog");
        await expect(taskDialog.getByLabel("Title")).toHaveValue(longTitle);
    });

    test("closes the more popover with the close button and outside taps", async ({
        page,
    }) => {
        await page.clock.install({
            time: new Date("2026-10-01T12:00:00-07:00"),
        });
        await signInAndOpenCalendar(page);

        const titles = [
            "Dense close event one",
            "Dense close event two",
            "Dense close event three",
            "Dense close event four",
        ];

        for (const title of titles) {
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

        const popover = page.locator("#task-calendar .fc-popover");

        await moreLink.tap();
        await expect(popover).toBeVisible();
        for (const title of titles) {
            await expect(popover).toContainText(title);
        }

        // The ✕ button in the popover header closes it
        await popover.locator(".fc-popover-close").tap();
        await expect(popover).toBeHidden();

        // The popover can be reopened and closed again
        await moreLink.tap();
        await expect(popover).toBeVisible();

        // A tap anywhere outside the popover closes it
        await page.locator(".fc-toolbar-title").tap();
        await expect(popover).toBeHidden();

        // FullCalendar's render pipeline must still work after the popover closed
        await page.locator(".fc-next-button").click();
        await expect(page.locator(".fc-toolbar-title")).toContainText(
            "November 2026",
        );
    });
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

test("keeps mobile in month view and synchronizes after resizing", async ({
    page,
}) => {
    await page.clock.install({
        time: new Date("2026-10-01T12:00:00-07:00"),
    });
    await page.setViewportSize({ width: 320, height: 844 });
    await signInAndOpenCalendar(page);

    const datePicker = page.locator(
        'input[type="text"][placeholder="Select Date.."]',
    );
    const weekButton = page.locator(".fc-timeGridWeek-button");
    const taskTitle = "Responsive calendar task";

    for (const width of [320, 390]) {
        await page.setViewportSize({ width, height: 844 });
        await expect(page.locator("#task-calendar .fc-daygrid")).toBeVisible();
        await expect(weekButton).toBeHidden();
        await expect(datePicker).toHaveValue("October 2026");
    }

    await page.getByRole("button", { name: "Create Task" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Title").fill(taskTitle);
    await dialog.getByLabel("Deadline").fill("2026-10-15T10:00");
    const creation = page.waitForResponse((response) =>
        response.url().includes("/livewire/update"),
    );
    await dialog.getByRole("button", { name: "Create" }).click();
    await creation;
    await expect(dialog).toBeHidden();

    const event = page
        .locator('#task-calendar [data-date="2026-10-15"] .fc-event')
        .filter({ hasText: taskTitle });
    await expect(event).toBeVisible();

    for (const width of [320, 639, 640, 1280, 640, 639]) {
        await page.setViewportSize({
            width,
            height: width <= 639 ? 844 : 900,
        });
        await expect(page.locator(".fc-priority-badge")).toHaveCount(0);
        await expect(event).toBeVisible();
    }

    await page.setViewportSize({ width: 1280, height: 900 });
    await expect(page.locator(".fc-priority-badge")).toHaveCount(0);
    await expect(weekButton).toBeVisible();
    await expect(weekButton).toBeEnabled();
    await weekButton.click();
    await expect(page.locator("#task-calendar .fc-timegrid")).toBeVisible();
    await expect(datePicker).toHaveValue("October 1, 2026");
    await page.locator(".fc-next-button").click();
    await expect(datePicker).toHaveValue("October 4, 2026");
    await page.locator(".fc-next-button").click();
    await expect(datePicker).toHaveValue("October 11, 2026");
    await expect(
        page.locator("#task-calendar .fc-event").filter({ hasText: taskTitle }),
    ).toBeVisible();

    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.locator("#task-calendar .fc-daygrid")).toBeVisible();
    await expect(weekButton).toBeHidden();
    await expect(datePicker).toHaveValue("October 2026");
    await expect(event).toBeVisible();
});
