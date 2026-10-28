function updateCalendarHeaderHeight(calendarEl) {
    const toolbarEl = calendarEl.querySelector(".fc-header-toolbar");

    const marginBottom = (element) =>
        element ? parseFloat(getComputedStyle(element).marginBottom) || 0 : 0;
    const height = (toolbarEl?.offsetHeight ?? 0) + marginBottom(toolbarEl);

    if (height > 0) {
        calendarEl.style.setProperty("--fc-header-height", `${height}px`);
    }
}

export function createCalendarLayoutObserver(calendarEl) {
    const observer = new ResizeObserver(() => {
        updateCalendarHeaderHeight(calendarEl);
    });

    const toolbarEl = calendarEl.querySelector(".fc-header-toolbar");
    if (toolbarEl) observer.observe(toolbarEl);
    observer.observe(calendarEl);
    updateCalendarHeaderHeight(calendarEl);

    return observer;
}

export function attachCalendarOverlay(calendarEl, overlayEl) {
    const harnessEl = calendarEl?.querySelector(".fc-view-harness");
    if (!harnessEl || !overlayEl) return;
    if (overlayEl.parentElement !== harnessEl) {
        harnessEl.appendChild(overlayEl);
    }
}
