export function registerCalendarCommitLoadingHook({
    hook,
    componentId,
    isDestroyed,
    startLoading,
    notifyError,
}) {
    return hook("commit", ({ component, commit, succeed, fail }) => {
        if (isDestroyed()) return;

        const calls = commit.calls ?? [];
        const isOwnFilterCommit =
            component.id === componentId &&
            ("filters.priority" in (commit.updates ?? {}) ||
                "filters.taskStatus" in (commit.updates ?? {}) ||
                calls.some((call) => call.method === "clearFilters"));
        const isTaskSavedDispatch = calls.some(
            (call) =>
                call.method === "__dispatch" &&
                call.params?.[0] === "task-saved",
        );

        if (!isOwnFilterCommit && !isTaskSavedDispatch) return;

        const stopLoading = startLoading();
        succeed(stopLoading);
        fail(() => {
            stopLoading();
            notifyError("The operation failed. Please try again.");
        });
    });
}
