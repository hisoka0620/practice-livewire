import { expect, test } from "@playwright/test";
import { signInAndOpenCalendar } from "./support/calendar";

// Visual baselines of the month calendar at common mobile widths.
// Regenerate after intentional UI changes with:
//   npm run test:e2e -- tests/e2e/calendar-screenshots.spec.ts --update-snapshots
const widths = [390, 480, 640] as const;

// The app ships a dark theme, so pin the color scheme for pixel baselines
test.use({ colorScheme: "dark" });

test("renders a stable month calendar at common mobile widths", async ({
    page,
}) => {
    // Pin the browser clock so the calendar always renders the same month.
    await page.clock.install({
        time: new Date("2026-10-01T12:00:00-07:00"),
    });
    await signInAndOpenCalendar(page, "calendar-screenshot@example.test");

    const seededEvent = page
        .locator('#task-calendar [data-date="2026-10-01"] .fc-event')
        .filter({ hasText: "Timezone boundary task" });

    for (const width of widths) {
        await page.setViewportSize({ width, height: 844 });
        await expect(seededEvent).toBeVisible();
        await page.evaluate(() => document.fonts.ready);

        await expect(page).toHaveScreenshot(`calendar-month-${width}w.png`, {
            fullPage: true,
            animations: "disabled",
            caret: "hide",
        });
    }
});
