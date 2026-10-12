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

    await expect(task.locator(".fc-priority-badge")).toHaveCount(0);
    await expect(task.locator(".fc-priority-dot")).toBeVisible();
    await expect(task.locator(".fc-event-time")).toBeHidden();
    await expect(actions).toBeHidden();
    await page.setViewportSize({ width: 640, height: 844 });
    await expect(task.locator(".fc-priority-dot")).toBeVisible();
    await expect(actions).toBeVisible();
    await actions.scrollIntoViewIfNeeded();
    const actionGeometry = await actions.evaluate((button) => {
        const actionRect = button.getBoundingClientRect();
        const titleRect = button
            .closest(".fc-event")
            ?.querySelector(".fc-event-title")
            ?.getBoundingClientRect();
        const dayRect = button
            .closest(".fc-daygrid-day")
            ?.getBoundingClientRect();

        return {
            width: actionRect.width,
            height: actionRect.height,
            withinDay: Boolean(
                dayRect &&
                    actionRect.left >= dayRect.left &&
                    actionRect.right <= dayRect.right &&
                    actionRect.top >= dayRect.top &&
                    actionRect.bottom <= dayRect.bottom,
            ),
            overlapsTitle: Boolean(
                titleRect &&
                    actionRect.left < titleRect.right &&
                    actionRect.right > titleRect.left &&
                    actionRect.top < titleRect.bottom &&
                    actionRect.bottom > titleRect.top,
            ),
        };
    });
    expect(actionGeometry.width).toBeGreaterThanOrEqual(24);
    expect(actionGeometry.height).toBeGreaterThanOrEqual(24);
    expect(actionGeometry.withinDay).toBe(true);
    expect(actionGeometry.overlapsTitle).toBe(false);

    await actions.tap();
    const markComplete = page.getByRole("button", {
        name: "Mark as Complete",
    });
    await expect(markComplete).toBeVisible();
    await page.keyboard.press("Escape");

    await task.locator(".fc-event-title").tap();
    const editDialog = page.getByRole("dialog");
    await expect(editDialog.getByText("Edit task")).toBeVisible();
    await editDialog.getByRole("button", { name: "Close modal" }).click();

    await task.click({ button: "right" });
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

test("opens the task modal instead of a context menu for mobile event taps", async ({
    page,
}) => {
    await page.setViewportSize({ width: 639, height: 844 });
    await page.clock.install({
        time: new Date("2026-10-01T12:00:00-07:00"),
    });
    await signInAndOpenCalendar(page);

    const title = "Mobile event opens task modal";
    await page.getByRole("button", { name: "Create Task" }).click();
    const createDialog = page.getByRole("dialog");
    await createDialog.getByLabel("Title").fill(title);
    await createDialog.getByLabel("Deadline").fill("2026-10-02T10:00");
    const creation = page.waitForResponse((response) =>
        response.url().includes("/livewire/update"),
    );
    await createDialog.getByRole("button", { name: "Create" }).click();
    await creation;
    await expect(createDialog).toBeHidden();

    for (const [additionalTitle, hour] of [
        ["Popover event two", "11:00"],
        ["Popover event three", "12:00"],
    ]) {
        await page.getByRole("button", { name: "Create Task" }).click();
        const dialog = page.getByRole("dialog");
        await dialog.getByLabel("Title").fill(additionalTitle);
        await dialog.getByLabel("Deadline").fill(`2026-10-02T${hour}`);
        const creation = page.waitForResponse((response) =>
            response.url().includes("/livewire/update"),
        );
        await dialog.getByRole("button", { name: "Create" }).click();
        await creation;
        await expect(dialog).toBeHidden();
    }

    const event = page
        .locator("#task-calendar .fc-event")
        .filter({ hasText: title });
    await expect(event.locator(".fc-event-actions-trigger")).toBeHidden();
    await event.click({ button: "right" });
    await expect(
        page.getByRole("button", { name: "Mark as Complete" }),
    ).toBeHidden();

    await event.locator(".fc-event-title").tap();
    const editDialog = page.getByRole("dialog");
    await expect(editDialog.getByLabel("Title")).toHaveValue(title);
    await editDialog.getByRole("button", { name: "Close modal" }).click();
    await expect(editDialog).toBeHidden();

    const day = page.locator(
        '#task-calendar .fc-daygrid-day[data-date="2026-10-02"]',
    );
    await day.locator(".fc-daygrid-more-link").click();
    const popover = page.locator("#task-calendar .fc-popover");
    await expect(popover).toBeVisible();
    const popoverEvent = popover
        .locator(".fc-event")
        .filter({ hasText: "Popover event three" });
    await expect(
        popoverEvent.locator(".fc-event-actions-trigger"),
    ).toBeHidden();
    await popoverEvent.locator(".fc-event-title").tap();
    const popoverDialog = page.getByRole("dialog");
    await expect(popoverDialog.getByLabel("Title")).toHaveValue(
        "Popover event three",
    );
});

test("keeps touch action targets large in landscape tablet-width calendars", async ({
    page,
}) => {
    await page.setViewportSize({ width: 844, height: 390 });
    await page.clock.install({
        time: new Date("2026-10-01T12:00:00-07:00"),
    });
    await signInAndOpenCalendar(page);

    await page.getByRole("button", { name: "Create Task" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Title").fill("Landscape touch action task");
    await dialog.getByLabel("Priority").selectOption("high");
    await dialog.getByLabel("Deadline").fill("2026-10-15T10:00");
    const creation = page.waitForResponse((response) =>
        response.url().includes("/livewire/update"),
    );
    await dialog.getByRole("button", { name: "Create" }).click();
    await creation;

    const task = page
        .locator('#task-calendar [data-date="2026-10-15"] .fc-event')
        .filter({ hasText: "Landscape touch action task" });
    await expect(task.locator(".fc-priority-badge")).toHaveCount(0);
    await expect(task.locator(".fc-priority-dot")).toBeVisible();
    const actions = task.getByRole("button", {
        name: "Actions for Landscape touch action task",
    });
    await expect(actions).toBeVisible();
    await actions.scrollIntoViewIfNeeded();
    const actionGeometry = await actions.evaluate((button) => {
        const actionRect = button.getBoundingClientRect();
        const titleRect = button
            .closest(".fc-event")
            ?.querySelector(".fc-event-title")
            ?.getBoundingClientRect();
        const dayRect = button
            .closest(".fc-daygrid-day")
            ?.getBoundingClientRect();
        const hitTarget = document.elementFromPoint(
            actionRect.left + actionRect.width / 2,
            actionRect.top + actionRect.height / 2,
        );

        return {
            width: actionRect.width,
            height: actionRect.height,
            withinDay: Boolean(
                dayRect &&
                    actionRect.left >= dayRect.left &&
                    actionRect.right <= dayRect.right &&
                    actionRect.top >= dayRect.top &&
                    actionRect.bottom <= dayRect.bottom,
            ),
            overlapsTitle: Boolean(
                titleRect &&
                    actionRect.left < titleRect.right &&
                    actionRect.right > titleRect.left &&
                    actionRect.top < titleRect.bottom &&
                    actionRect.bottom > titleRect.top,
            ),
            hitTargetIsAction: Boolean(
                hitTarget?.closest(".fc-event-actions-trigger"),
            ),
        };
    });

    expect(actionGeometry.width).toBeGreaterThanOrEqual(24);
    expect(actionGeometry.height).toBeGreaterThanOrEqual(24);
    expect(actionGeometry.withinDay).toBe(true);
    expect(actionGeometry.overlapsTitle).toBe(false);
    expect(actionGeometry.hitTargetIsAction).toBe(true);

    await actions.tap();
    await expect(
        page.getByRole("button", { name: "Mark as Complete" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Delete", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Delete Task" })).toBeVisible();
    const deletion = page.waitForResponse((response) =>
        response.url().includes("/livewire/update"),
    );
    await page.getByRole("button", { name: "Delete", exact: true }).last().click();
    await deletion;
    await expect(task).toHaveCount(0);
});

test("preserves selected priorities, event dots, and full legend labels", async ({
    page,
}) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.clock.install({
        time: new Date("2026-10-01T12:00:00-07:00"),
    });
    await signInAndOpenCalendar(page);

    const priorities = [
        {
            title: "High priority task",
            value: "high",
            label: "High",
            hex: "ef4444",
            color: "rgb(239, 68, 68)",
            day: "12",
        },
        {
            title: "Medium priority task",
            value: "medium",
            label: "Medium",
            hex: "fbbf24",
            color: "rgb(251, 191, 36)",
            day: "13",
        },
        {
            title: "Low priority task",
            value: "low",
            label: "Low",
            hex: "3b82f6",
            color: "rgb(59, 130, 246)",
            day: "14",
        },
    ];

    for (const priority of priorities) {
        await page.getByRole("button", { name: "Create Task" }).click();
        const dialog = page.getByRole("dialog");
        await dialog.getByLabel("Title").fill(priority.title);
        await dialog.getByLabel("Priority").selectOption(priority.value);
        await dialog
            .getByLabel("Deadline")
            .fill(`2026-10-${priority.day}T10:00`);
        const creation = page.waitForResponse((response) =>
            response.url().includes("/livewire/update"),
        );
        await dialog.getByRole("button", { name: "Create" }).click();
        await creation;
        await expect(dialog).toBeHidden();
    }

    for (const priority of priorities) {
        const event = page
            .locator(`#task-calendar [data-date="2026-10-${priority.day}"] .fc-event`)
            .filter({ hasText: priority.title });
        await expect(event.locator(".fc-priority-badge")).toHaveCount(0);
        await expect(event.locator(".fc-priority-dot")).toHaveCount(1);
        const legend = page.getByText("Priority:", { exact: true }).locator("..");
        const legendLabel = legend.getByText(priority.label, { exact: true });
        await expect(legendLabel).toBeVisible();
        const legendItem = legendLabel.locator("..");
        await expect(legendItem).toHaveText(priority.label);
        await expect(legendItem.locator("span.rounded-full")).toHaveClass(
            new RegExp(`bg-\\[#${priority.hex}\\]`),
        );
    }

    await page.setViewportSize({ width: 640, height: 844 });
    const mediumEvent = page
        .locator('#task-calendar [data-date="2026-10-13"] .fc-event')
        .filter({ hasText: "Medium priority task" });
    const mediumActions = mediumEvent.getByRole("button", {
        name: "Actions for Medium priority task",
    });
    await mediumActions.tap();
    await expect(
        page.getByRole("button", { name: "Mark as Complete" }),
    ).toBeVisible();

    await page.setViewportSize({ width: 1280, height: 900 });
    for (const priority of priorities) {
        const event = page
            .locator(`#task-calendar [data-date="2026-10-${priority.day}"] .fc-event`)
            .filter({ hasText: priority.title });
        await expect(event.locator(".fc-priority-dot")).toBeVisible();
        await expect(event.locator(".fc-priority-badge")).toHaveCount(0);
        await expect(event.locator(".fc-priority-dot")).toHaveCSS(
            "background-color",
            priority.color,
        );
    }
});