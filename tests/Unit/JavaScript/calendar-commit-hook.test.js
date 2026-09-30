import assert from "node:assert/strict";
import test from "node:test";
import { registerCalendarCommitLoadingHook } from "../../../resources/js/calendar/commit-hook.js";

for (const property of ["filters.priority", "filters.taskStatus"]) {
    test(`shows loading until the ${property} commit succeeds`, () => {
        let commitHandler;
        let loadingStarted = 0;
        let loadingStopped = 0;
        let finishCommit;
        const unregister = registerCalendarCommitLoadingHook({
            hook: (_name, handler) => {
                commitHandler = handler;
                return () => {};
            },
            componentId: "calendar-component",
            isDestroyed: () => false,
            startLoading: () => {
                loadingStarted++;
                return () => loadingStopped++;
            },
            notifyError: () => assert.fail("unexpected error notification"),
        });

        commitHandler({
            component: { id: "calendar-component" },
            commit: { updates: { [property]: "changed" } },
            succeed: (callback) => {
                finishCommit = callback;
            },
            fail: () => {},
        });

        assert.equal(loadingStarted, 1);
        assert.equal(loadingStopped, 0);

        finishCommit();

        assert.equal(loadingStopped, 1);
        unregister();
    });
}
