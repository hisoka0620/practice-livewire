import { defineConfig } from "@playwright/test";
import { resolve } from "node:path";

const baseURL = "http://127.0.0.1:8017";
const databasePath = resolve(process.cwd(), "database/e2e.sqlite");
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
        env: testEnvironment,
    },
});
