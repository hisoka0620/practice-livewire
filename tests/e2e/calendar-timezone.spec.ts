import { expect, test, type Page } from "@playwright/test";

async function signInAndOpenCalendar(page: Page) {
    await page.goto("/todo-list");
    await page.getByLabel("Email address").fill("calendar-e2e@example.test");
    await page.getByRole("textbox", { name: "Password" }).fill("password");
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page).toHaveURL(/\/todo-list$/);
    await page.getByRole("button", { name: "Calendar", exact: true }).click();
}

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

test("shows and drags a Tokyo deadline in Los Angeles local time", async ({
    page,
}) => {
    await page.clock.install({
        time: new Date("2026-10-01T12:00:00-07:00"),
    });

    await signInAndOpenCalendar(page);

    expect(
        await page.evaluate(
            () => Intl.DateTimeFormat().resolvedOptions().timeZone,
        ),
    ).toBe("America/Los_Angeles");

    const sourceCell = page.locator('.fc-daygrid-day[data-date="2026-10-01"]');
    const sourceEvent = sourceCell
        .locator(".fc-event")
        .filter({ hasText: "Timezone boundary task" });

    await expect(sourceEvent).toBeVisible();
    await expect(sourceEvent.locator(".fc-event-time")).toHaveText("8:30 am");

    await sourceEvent.click();
    const deadlineInput = page.getByLabel("Deadline");
    await expect(deadlineInput).toHaveValue("2026-10-01T08:30");
    await page.getByRole("button", { name: "Update" }).click();
    await expect(deadlineInput).toBeHidden();

    await sourceCell
        .locator(".fc-event")
        .filter({ hasText: "Timezone boundary task" })
        .click();
    await expect(deadlineInput).toHaveValue("2026-10-01T08:30");

    const localBoundaryIso = "2026-10-02T06:30:00.000Z";
    const boundaryUpdate = page.waitForRequest(
        (request) =>
            request.url().includes("/livewire/update") &&
            Boolean(request.postData()?.includes(localBoundaryIso)),
    );
    await deadlineInput.fill("2026-10-01T23:30");
    expect((await boundaryUpdate).postData()).toContain(localBoundaryIso);
    await page.getByRole("button", { name: "Update" }).click();
    await expect(deadlineInput).toBeHidden();

    await sourceCell
        .locator(".fc-event")
        .filter({ hasText: "Timezone boundary task" })
        .click();
    await expect(deadlineInput).toHaveValue("2026-10-01T23:30");
    await page.getByRole("button", { name: "Cancel" }).click();

    const sourceBox = await sourceEvent.boundingBox();
    const targetBox = await page
        .locator(
            '.fc-daygrid-day[data-date="2026-10-03"] .fc-daygrid-day-frame',
        )
        .boundingBox();

    expect(sourceBox).not.toBeNull();
    expect(targetBox).not.toBeNull();

    await page.mouse.move(
        sourceBox!.x + sourceBox!.width / 2,
        sourceBox!.y + sourceBox!.height / 2,
    );
    await page.mouse.down();
    await page.mouse.move(
        targetBox!.x + targetBox!.width / 2,
        targetBox!.y + targetBox!.height / 2,
        { steps: 12 },
    );
    await page.mouse.up();

    const movedEvent = page
        .locator('.fc-daygrid-day[data-date="2026-10-03"] .fc-event')
        .filter({ hasText: "Timezone boundary task" });

    await expect(movedEvent).toBeVisible();
    await expect(movedEvent.locator(".fc-event-time")).toHaveText("11:30 pm");

    await page.reload();

    const persistedEvent = page
        .locator('.fc-daygrid-day[data-date="2026-10-03"] .fc-event')
        .filter({ hasText: "Timezone boundary task" });

    await expect(persistedEvent).toBeVisible();
    await expect(persistedEvent.locator(".fc-event-time")).toHaveText(
        "11:30 pm",
    );
});

test("applies deterministic daylight-saving rules to local modal times", async ({
    page,
}) => {
    await page.clock.install({
        time: new Date("2026-10-01T12:00:00-07:00"),
    });

    await signInAndOpenCalendar(page);

    const event = page
        .locator('.fc-daygrid-day[data-date="2026-10-03"] .fc-event')
        .filter({ hasText: "Timezone boundary task" });
    await expect(event).toBeVisible();
    await event.click();

    const deadlineInput = page.getByLabel("Deadline");
    const springGapIso = "2026-03-08T10:30:00.000Z";
    const springUpdate = page.waitForRequest(
        (request) =>
            request.url().includes("/livewire/update") &&
            Boolean(request.postData()?.includes(springGapIso)),
    );
    await deadlineInput.fill("2026-03-08T02:30");
    expect((await springUpdate).postData()).toContain(springGapIso);
    await page.getByRole("button", { name: "Update" }).click();
    await expect(deadlineInput).toBeHidden();

    for (let month = 0; month < 7; month++) {
        await page.locator(".fc-prev-button").click();
    }

    const springEvent = page
        .locator('.fc-daygrid-day[data-date="2026-03-08"] .fc-event')
        .filter({ hasText: "Timezone boundary task" });
    await expect(springEvent).toBeVisible();
    await expect(springEvent.locator(".fc-event-time")).toHaveText("3:30 am");

    await springEvent.click();
    const fallOverlapIso = "2026-11-01T08:30:00.000Z";
    const fallUpdate = page.waitForRequest(
        (request) =>
            request.url().includes("/livewire/update") &&
            Boolean(request.postData()?.includes(fallOverlapIso)),
    );
    await deadlineInput.fill("2026-11-01T01:30");
    expect((await fallUpdate).postData()).toContain(fallOverlapIso);
    await page.getByRole("button", { name: "Update" }).click();
    await expect(deadlineInput).toBeHidden();

    for (let month = 0; month < 8; month++) {
        await page.locator(".fc-next-button").click();
    }

    const fallEvent = page
        .locator('.fc-daygrid-day[data-date="2026-11-01"] .fc-event')
        .filter({ hasText: "Timezone boundary task" });
    await expect(fallEvent).toBeVisible();
    await expect(fallEvent.locator(".fc-event-time")).toHaveText("1:30 am");
});
