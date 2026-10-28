import { expect, test } from "@playwright/test";
import { signInAndOpenCalendar } from "./support/calendar";

test("shows loading and refreshes matching calendar events during search", async ({
    page,
}) => {
    await page.clock.install({
        time: new Date("2026-10-01T12:00:00-07:00"),
    });
    await page.addInitScript(() => {
        document.addEventListener("livewire:init", () => {
            (window as any).__calendarCommits = [];
            (window as any).Livewire.hook(
                "commit",
                ({ component, commit }: any) => {
                    (window as any).__calendarCommits.push({
                        componentId: component.id,
                        componentName: component.name,
                        updates: commit.updates,
                        calls: commit.calls,
                    });
                },
            );
        });
    });

    let releaseSearchResponse: (() => void) | undefined;
    let markSearchRequestStarted: (() => void) | undefined;
    const searchRequestStarted = new Promise<void>((resolve) => {
        markSearchRequestStarted = resolve;
    });
    let shouldHoldSearchResponse = true;

    await page.route("**/livewire/update", async (route) => {
        const postData = route.request().postData() ?? "";

        if (shouldHoldSearchResponse && postData.includes('"filters.search"')) {
            shouldHoldSearchResponse = false;
            markSearchRequestStarted?.();
            await new Promise<void>((resolve) => {
                releaseSearchResponse = resolve;
            });
        }

        await route.continue();
    });

    await signInAndOpenCalendar(page);
    await expect(
        page.locator('#task-calendar .fc-daygrid-day[data-date="2026-10-01"]'),
    ).toBeVisible();
    await expect(
        page
            .locator("#task-calendar .fc-event")
            .filter({ hasText: "Timezone boundary task" }),
    ).toBeVisible();

    const searchInput = page.getByPlaceholder("Search tasks...");
    const loadingOverlay = page.locator(
        '#calendar-container [x-ref="tableOverlay"]',
    );
    await searchInput.fill("no matching task");
    await searchRequestStarted;

    try {
        const calendarId = await page
            .locator("#task-calendar")
            .evaluate((calendar) =>
                calendar.closest("[wire\\:id]")?.getAttribute("wire:id"),
            );
        expect(calendarId).toBeTruthy();

        await expect
            .poll(() =>
                page.evaluate(
                    ({ componentId, searchValue }) =>
                        (window as any).__calendarCommits.some(
                            (commit: any) =>
                                commit.componentId === componentId &&
                                commit.componentName === "calendar-view" &&
                                commit.updates?.["filters.search"] ===
                                    searchValue,
                        ),
                    {
                        componentId: calendarId,
                        searchValue: "no matching task",
                    },
                ),
            )
            .toBe(true);

        await expect(loadingOverlay).toBeVisible();
    } finally {
        releaseSearchResponse?.();
    }

    await expect(loadingOverlay).toBeHidden();
    await expect(page.locator("#task-calendar .fc-event")).toHaveCount(0);

    await searchInput.fill("Timezone boundary task");
    await expect(
        page
            .locator("#task-calendar .fc-event")
            .filter({ hasText: "Timezone boundary task" }),
    ).toBeVisible();
});
