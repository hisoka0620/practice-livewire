import { defineConfig } from "@playwright/test";
import { availableParallelism } from "node:os";
import { resolve } from "node:path";

const baseURL = "http://127.0.0.1:8017";
const databasePath = resolve(process.cwd(), "database/e2e.sqlite");
const workers = process.env.CI
    ? 1
    : Math.min(2, Math.max(1, Math.floor(availableParallelism() / 2)));
const testEnvironment = {
    APP_ENV: "testing",
    DB_CONNECTION: "sqlite",
    DB_DATABASE: databasePath,
    CACHE_STORE: "array",
    QUEUE_CONNECTION: "sync",
    SESSION_DRIVER: "file",
};

export default defineConfig({
    testDir: "./tests/e2e",
    globalSetup: "./tests/e2e/global-setup.ts",
    fullyParallel: false,
    workers,
    projects: [
        {
            name: "chromium",
            use: { browserName: "chromium" },
        },
    ],
    use: {
        baseURL,
        timezoneId: "America/Los_Angeles",
        viewport: { width: 1440, height: 1000 },
        trace: "retain-on-failure",
    },
    webServer: {
        command: "php artisan serve --host=127.0.0.1 --port=8017",
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        env: {
            ...testEnvironment,
            // The built-in server is single-threaded by default; without
            // extra workers, two Playwright workers can pile up requests
            // on one endpoint and time out waiting for a redirect.
            PHP_CLI_SERVER_WORKERS: "4",
        },
    },
});
