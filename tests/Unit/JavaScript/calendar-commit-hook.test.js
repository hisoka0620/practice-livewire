import assert from "node:assert/strict";
import test from "node:test";
import { registerCalendarCommitLoadingHook } from "../../../resources/js/calendar/commit-hook.js";

function createHarness({ destroyed = () => false } = {}) {
    let commitHandler;
    let succeed;
    let fail;
    let loadingStarted = 0;
    let loadingStopped = 0;
    const errors = [];

    registerCalendarCommitLoadingHook({
        hook: (_name, handler) => {
            commitHandler = handler;
            return () => {};
        },
        componentId: "calendar-component",
        isDestroyed: destroyed,
        startLoading: () => {
            loadingStarted++;
            return () => loadingStopped++;
        },
        notifyError: (message) => errors.push(message),
    });

    return {
        commit(componentId, updates = {}, calls = []) {
            commitHandler({
                component: { id: componentId },
                commit: { updates, calls },
                succeed: (callback) => {
                    succeed = callback;
                },
                fail: (callback) => {
                    fail = callback;
                },
            });
        },
        succeed: () => succeed?.(),
        fail: () => fail?.(),
        get loadingStarted() {
            return loadingStarted;
        },
        get loadingStopped() {
            return loadingStopped;
        },
        errors,
    };
}

for (const property of ["filters.priority", "filters.taskStatus"]) {
    test(`shows loading until the ${property} commit succeeds`, () => {
        const harness = createHarness();
        harness.commit("calendar-component", { [property]: "changed" });

        assert.equal(harness.loadingStarted, 1);
        assert.equal(harness.loadingStopped, 0);

        harness.succeed();

        assert.equal(harness.loadingStopped, 1);
    });
}

test("shows loading for the CalendarView search and stops on success", () => {
    const harness = createHarness();
    harness.commit("calendar-component", { "filters.search": "deadline" });

    assert.equal(harness.loadingStarted, 1);
    assert.equal(harness.loadingStopped, 0);

    harness.succeed();

    assert.equal(harness.loadingStopped, 1);
    assert.deepEqual(harness.errors, []);
});

test("ignores search and filter commits from unrelated components", () => {
    const harness = createHarness();

    harness.commit("todo-list-component", {
        "filters.search": "deadline",
    });
    harness.commit("filters-bar-component", {
        "filters.search": "deadline",
    });
    harness.commit("todo-list-component", { "filters.priority": "high" });
    harness.commit("filters-bar-component", { "filters.sort": "deadline" });

    assert.equal(harness.loadingStarted, 0);
    assert.equal(harness.loadingStopped, 0);
});

test("stops loading and notifies when a matching commit fails", () => {
    const harness = createHarness();
    harness.commit("calendar-component", { "filters.search": "deadline" });

    harness.fail();

    assert.equal(harness.loadingStarted, 1);
    assert.equal(harness.loadingStopped, 1);
    assert.deepEqual(harness.errors, [
        "The operation failed. Please try again.",
    ]);
});

test("ignores matching commits after the calendar is destroyed", () => {
    const harness = createHarness({ destroyed: () => true });
    harness.commit("calendar-component", { "filters.search": "deadline" });

    assert.equal(harness.loadingStarted, 0);
    assert.equal(harness.loadingStopped, 0);
    assert.deepEqual(harness.errors, []);
});
