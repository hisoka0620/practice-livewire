import assert from "node:assert/strict";
import test from "node:test";
import { createLoadingState } from "../../../resources/js/calendar/loading-state.js";

test("keeps loading visible until every overlapping operation completes", async () => {
    const changes = [];
    let markVisible;
    const loadingVisible = new Promise((resolve) => {
        markVisible = resolve;
    });
    const loadingState = createLoadingState(0, (isLoading) => {
        changes.push(isLoading);
        if (isLoading) markVisible();
    });
    const finishFirst = loadingState.start();
    const finishSecond = loadingState.start();

    await loadingVisible;

    assert.deepEqual(changes, [true]);

    finishFirst();
    assert.deepEqual(changes, [true]);

    finishSecond();
    assert.deepEqual(changes, [true, false]);
});

test("does not show loading when all operations finish before the delay", async () => {
    const changes = [];
    const loadingState = createLoadingState(5, (isLoading) => {
        changes.push(isLoading);
    });
    const finish = loadingState.start();

    finish();
    await new Promise((resolve) => setTimeout(resolve, 10));

    assert.deepEqual(changes, []);
});

test("finishing an operation more than once does not affect other operations", async () => {
    const changes = [];
    let markVisible;
    const loadingVisible = new Promise((resolve) => {
        markVisible = resolve;
    });
    const loadingState = createLoadingState(0, (isLoading) => {
        changes.push(isLoading);
        if (isLoading) markVisible();
    });
    const finishFirst = loadingState.start();
    const finishSecond = loadingState.start();

    finishFirst();
    finishFirst();
    await loadingVisible;

    assert.deepEqual(changes, [true]);

    finishSecond();
    assert.deepEqual(changes, [true, false]);
});
