import { expect, type Page } from "@playwright/test";

export async function signInAndOpenCalendar(page: Page) {
    await page.goto("/todo-list");
    await page.getByLabel("Email address").fill("calendar-e2e@example.test");
    await page.getByRole("textbox", { name: "Password" }).fill("password");
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page).toHaveURL(/\/todo-list$/);
    await page.getByRole("button", { name: "Calendar", exact: true }).click();
}
