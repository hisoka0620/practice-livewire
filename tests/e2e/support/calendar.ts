import { expect, type Page } from "@playwright/test";

const DEFAULT_EMAIL = "calendar-e2e@example.test";

export async function signInAndOpenCalendar(
    page: Page,
    email: string = DEFAULT_EMAIL,
) {
    await page.goto("/todo-list");
    await page.getByLabel("Email address").fill(email);
    await page.getByRole("textbox", { name: "Password" }).fill("password");
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page).toHaveURL(/\/todo-list$/);
    await page.getByRole("button", { name: "Calendar", exact: true }).click();
}
