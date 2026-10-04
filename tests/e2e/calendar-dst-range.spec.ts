import { expect, test } from "@playwright/test";
import { signInAndOpenCalendar } from "./support/calendar";

test.use({ timezoneId: "Europe/Berlin" });

test("loads the six-week October calendar across the Berlin DST change", async ({
    page,
}) => {
    await page.clock.install({
        time: new Date("2027-10-15T12:00:00+02:00"),
    });

    await signInAndOpenCalendar(page);

    expect(
        await page.evaluate(
            () => Intl.DateTimeFormat().resolvedOptions().timeZone,
        ),
    ).toBe("Europe/Berlin");

    await expect(page.locator(".fc-toolbar-title")).toHaveText("October 2027");
    await expect(page.locator("#task-calendar .fc-daygrid-day")).toHaveCount(
        42,
    );
    await expect(
        page.locator(
            '#task-calendar .fc-daygrid-day[data-date="2027-09-26"]',
        ),
    ).toBeVisible();
    await expect(
        page.locator(
            '#task-calendar .fc-daygrid-day[data-date="2027-11-06"]',
        ),
    ).toBeVisible();
    await expect(
        page.getByRole("heading", { name: "Operation failed" }),
    ).toBeHidden();

    // [Sep 26 00:00 CEST, Nov 7 00:00 CET) is 42 local days plus one hour.
    await page
        .locator('#task-calendar .fc-daygrid-day[data-date="2027-10-15"]')
        .click();
    const taskModal = page.getByRole("dialog");
    await expect(taskModal).toBeVisible();
    await expect(taskModal.getByLabel("Title")).toBeVisible();
    await page.getByLabel("Title").fill("Berlin DST range task");
    await page.getByRole("button", { name: "Create", exact: true }).click();

    await expect(
        page
            .locator("#task-calendar .fc-event")
            .filter({ hasText: "Berlin DST range task" }),
    ).toBeVisible();
    await expect(
        page.getByRole("heading", { name: "Operation failed" }),
    ).toBeHidden();
});
