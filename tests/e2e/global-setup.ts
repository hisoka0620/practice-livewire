import { execFileSync } from "node:child_process";
import { closeSync, mkdirSync, openSync } from "node:fs";
import { dirname, resolve } from "node:path";

export default function globalSetup() {
    const databasePath = resolve(process.cwd(), "database/e2e.sqlite");
    mkdirSync(dirname(databasePath), { recursive: true });
    const fileDescriptor = openSync(databasePath, "a");
    closeSync(fileDescriptor);

    execFileSync(
        "php",
        ["artisan", "migrate:fresh", "--seed", "--seeder=E2ESeeder", "--force"],
        {
            env: {
                ...process.env,
                APP_ENV: "testing",
                DB_CONNECTION: "sqlite",
                DB_DATABASE: databasePath,
                CACHE_STORE: "array",
                QUEUE_CONNECTION: "sync",
                SESSION_DRIVER: "file",
            },
            stdio: "inherit",
        },
    );
}
