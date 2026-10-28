export function createLoadingState(delay, onChange) {
    let activeOperations = 0;
    let loadingTimer = null;
    let isVisible = false;

    return {
        start() {
            activeOperations++;

            if (activeOperations === 1) {
                loadingTimer = setTimeout(() => {
                    loadingTimer = null;
                    if (activeOperations > 0) {
                        isVisible = true;
                        onChange(true);
                    }
                }, delay);
            }

            let isActive = true;

            return () => {
                if (!isActive) return;
                isActive = false;
                activeOperations--;

                if (activeOperations > 0) return;

                clearTimeout(loadingTimer);
                loadingTimer = null;

                if (isVisible) {
                    isVisible = false;
                    onChange(false);
                }
            };
        },
    };
}
