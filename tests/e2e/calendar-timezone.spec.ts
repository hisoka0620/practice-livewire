import { expect, test } from "@playwright/test";

test("shows and drags a Tokyo deadline in Los Angeles local time", async ({
    page,
}) => {
    await page.clock.install({
        time: new Date("2026-10-01T12:00:00-07:00"),
    });

    await page.goto("/todo-list");
    await page.getByLabel("Email address").fill("calendar-e2e@example.test");
    await page.getByRole("textbox", { name: "Password" }).fill("password");
    await page.getByRole("button", { name: "Log in" }).click();

    await expect(page).toHaveURL(/\/todo-list$/);
    await page.getByRole("button", { name: "Calendar", exact: true }).click();

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
    await expect(movedEvent.locator(".fc-event-time")).toHaveText("8:30 am");

    await page.reload();

    const persistedEvent = page
        .locator('.fc-daygrid-day[data-date="2026-10-03"] .fc-event')
        .filter({ hasText: "Timezone boundary task" });

    await expect(persistedEvent).toBeVisible();
    await expect(persistedEvent.locator(".fc-event-time")).toHaveText(
        "8:30 am",
    );
});
