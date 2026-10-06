import { expect, test } from "@playwright/test";
import { signInAndOpenCalendar } from "./support/calendar";

test.use({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
});

test("supports touch and keyboard task actions without hijacking task clicks", async ({
    page,
}) => {
    await page.clock.install({
        time: new Date("2026-10-01T12:00:00-07:00"),
    });
    await signInAndOpenCalendar(page);

    await page.getByRole("button", { name: "Create Task" }).click();
    const createDialog = page.getByRole("dialog");
    await createDialog.getByLabel("Title").fill("Touch action test task");
    await createDialog.getByLabel("Priority").selectOption("high");
    await createDialog.getByLabel("Deadline").fill("2026-10-02T10:00");
    const createTask = page.waitForResponse((response) =>
        response.url().includes("/livewire/update"),
    );
    await createDialog.getByRole("button", { name: "Create" }).click();
    await createTask;

    const task = page
        .locator("#task-calendar .fc-event")
        .filter({ hasText: "Touch action test task" });
    const actions = task.getByRole("button", {
        name: "Actions for Touch action test task",
    });

    await expect(actions).toBeVisible();
    await task.locator(".fc-event-title").click();
    const editDialog = page.getByRole("dialog");
    await expect(editDialog.getByText("Edit task")).toBeVisible();
    await editDialog.getByRole("button", { name: "Close modal" }).click();

    await task.click({ button: "right" });
    const markComplete = page.getByRole("button", {
        name: "Mark as Complete",
    });
    await expect(markComplete).toBeVisible();
    await markComplete.focus();
    await page.keyboard.press("Escape");
    await expect(markComplete).toBeHidden();

    await actions.focus();
    await page.keyboard.press("Enter");
    await expect(markComplete).toBeFocused();
    const keyboardCompletion = page.waitForResponse((response) =>
        response.url().includes("/livewire/update"),
    );
    await page.keyboard.press("Enter");
    await keyboardCompletion;

    await actions.tap();
    const markIncomplete = page.getByRole("button", {
        name: "Mark as Incomplete",
    });
    await expect(markIncomplete).toBeVisible();
    const touchIncomplete = page.waitForResponse((response) =>
        response.url().includes("/livewire/update"),
    );
    await markIncomplete.tap();
    await touchIncomplete;

    await actions.tap();
    await expect(markComplete).toBeVisible();
    const touchCompletion = page.waitForResponse((response) =>
        response.url().includes("/livewire/update"),
    );
    await markComplete.tap();
    await touchCompletion;

    await actions.tap();
    await page.getByRole("button", { name: "Delete", exact: true }).tap();
    await expect(page.getByRole("heading", { name: "Delete Task" })).toBeVisible();
    const deletion = page.waitForResponse((response) =>
        response.url().includes("/livewire/update"),
    );
    await page.getByRole("button", { name: "Delete", exact: true }).last().click();
    await deletion;

    await expect(task).toHaveCount(0);
});