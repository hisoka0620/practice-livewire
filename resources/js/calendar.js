import { Calendar } from "@fullcalendar/core";
import flatpickr from "flatpickr";
import monthSelectPlugin from "flatpickr/dist/plugins/monthSelect/index.js";
import { getUserTimeZone } from "./deadline";
import {
    attachCalendarOverlay,
    createCalendarLayoutObserver,
} from "./calendar/layout";
import { createLoadingState } from "./calendar/loading-state";
import { registerCalendarCommitLoadingHook } from "./calendar/commit-hook";
import { processEventsByView } from "./calendar/event-utils";
import {
    createCalendarOptions,
    createEventTooltipController,
    getCalendarHeight,
    getDayHeaderFormat,
    getDayMaxEvents,
    MOBILE_CALENDAR_MAX_WIDTH,
} from "./calendar/options";
import {
    combineDateAndTime,
    formatForServer,
    resolveNewDeadline,
    resolveWeekScrollTime,
} from "./calendar/date-utils";

//
const LOADING_DELAY_MS = 200;

/**
 * Alpine data for the calendar view.
 */
export default (wire) => ({
    calendar: null,
    userTimeZone: getUserTimeZone(),
    flatPickr: null, // flatpickr (month select) instance
    isLoading: false,
    _loadingState: null,
    errorMessage: "",
    datePickerViewType: "dayGridMonth",
    _skipDatePickerSync: false, // Skips overwriting the displayed date when gotoDate was triggered by flatpickr's own selection
    _destroyed: false, // Guards against Livewire.hook running after this component is destroyed
    _offCommitHook: null,
    _onScroll: null, // Function reference passed to document.addEventListener("scroll", ...) (kept so removeEventListener gets the same reference)
    _onWindowResize: null,
    _calendarEl: null,
    _onCalendarMouseDown: null,
    _layoutResizeObserver: null, // ResizeObserver watching the toolbar height (reflects --fc-header-height)
    _eventTooltipController: null,
    contextMenu: {
        visible: false,
        x: 0,
        y: 0,
        taskId: null,
        isCompleted: false,
    }, // State of the context menu shown on right click
    init() {
        this._destroyed = false;
        this._loadingState = createLoadingState(
            LOADING_DELAY_MS,
            (isLoading) => {
                this.isLoading = isLoading;
            },
        );
        // Fires every time the calendarEvents property is updated
        wire.on("calendarEventsUpdated", (payload) => {
            if (!this.calendar) return;
            const rawEvents = payload?.events ?? payload ?? [];
            // Process events according to the current view
            const events = processEventsByView(
                rawEvents,
                this.calendar.view.type,
            );
            this.calendar.removeAllEventSources();
            this.calendar.addEventSource(events);
            this.toggleNoEventsMessage(events.length === 0);
        });

        // Detect this component's communication (property updates, method calls)
        // and reflect only filter-related operations in isLoading (month/week
        // navigation remains handled by datesSet → runWireAction)
        this._offCommitHook = registerCalendarCommitLoadingHook({
            hook: Livewire.hook.bind(Livewire),
            componentId: wire.$id,
            isDestroyed: () => this._destroyed,
            startLoading: () => this.startLoading(),
            notifyError: (message) => this.notifyError(message),
        });

        // Close the menu on scroll
        this._onScroll = () => this.closeContextMenu();
        document.addEventListener("scroll", this._onScroll, true);

        if (this._onWindowResize) {
            window.removeEventListener("resize", this._onWindowResize);
        }
        this._onWindowResize = () => this.syncResponsiveView();
        window.addEventListener("resize", this._onWindowResize);

        this.renderCalendar();
        this.syncResponsiveView();
        this.initFlatPickr();
    },
    destroy() {
        this._destroyed = true;
        // Unregister the Livewire hook (safe to call)
        if (typeof this._offCommitHook === "function") {
            this._offCommitHook();
        }
        document.removeEventListener("scroll", this._onScroll, true);
        if (this._onWindowResize) {
            window.removeEventListener("resize", this._onWindowResize);
            this._onWindowResize = null;
        }
        this.removeCalendarMouseDownListener();
        this._layoutResizeObserver?.disconnect();
        this.flatPickr?.destroy();
        this.calendar?.destroy();
        this._eventTooltipController?.destroy();
        this._eventTooltipController = null;
        this.calendar = null;
    },
    /**
     * Initialize flatpickr (monthSelect plugin) for month jumping.
     * Enabling allowInput structurally avoids bugs specific to the browser's
     * native month input widget when typing directly (auto year completion, 0000/1901, etc).
     */
    initFlatPickr(viewType = "dayGridMonth") {
        const inputEl =
            this.$refs?.datePicker ||
            this.$el.querySelector('[x-ref="datePicker"]');
        if (!inputEl) return;

        // Prevent double initialization (guards against Livewire re-renders and Alpine re-init)
        if (this.flatPickr) {
            this.flatPickr.destroy();
            this.flatPickr = null;
        }

        this.datePickerViewType = viewType;

        const viewOptions =
            viewType === "dayGridMonth"
                ? {
                      plugins: [
                          new monthSelectPlugin({
                              shorthand: true,
                              dateFormat: "Y-m",
                              altFormat: "F Y",
                              theme: "dark",
                          }),
                      ],
                      dateFormat: "Y-m",
                      altFormat: "F Y",
                  }
                : {
                      dateFormat: "Y-m-d",
                      altFormat: "F j, Y",
                  };

        this.flatPickr = flatpickr(inputEl, {
            ...viewOptions,
            altInput: true,
            disableMobile: true,
            defaultDate: this.calendar?.getDate() ?? new Date(),
            onChange: (_selectedDates, dateStr) => this.jumpToDate(dateStr),
        });
    },
    /**
     * Sync only flatpickr's displayed value to the FullCalendar display period.
     * @param {Date} currentStart - info.view.currentStart
     */
    syncDatePicker(currentStart) {
        if (!this.flatPickr) return;

        this.flatPickr.setDate(currentStart, false);
    },
    renderCalendar() {
        if (!this.$el) {
            return;
        }

        const calendarEl = this.$el.querySelector("#task-calendar");
        if (!calendarEl) {
            return;
        }

        this.calendar?.destroy();
        this._eventTooltipController?.destroy();
        this._eventTooltipController = null;
        this.removeCalendarMouseDownListener();

        // While the context menu is open, swallow the click that closes it
        // during the capture phase of mousedown, so it never reaches
        // FullCalendar's own click detection (which starts from mousedown)
        this._calendarEl = calendarEl;
        this._onCalendarMouseDown = (jsEvent) => {
            if (this.contextMenu.visible) {
                jsEvent.preventDefault();
                jsEvent.stopPropagation();
                this.closeContextMenu();
            }
        };
        calendarEl.addEventListener(
            "mousedown",
            this._onCalendarMouseDown,
            true,
        );

        this._eventTooltipController = createEventTooltipController({
            userTimeZone: this.userTimeZone,
        });
        this.calendar = new Calendar(
            calendarEl,
            createCalendarOptions({
                userTimeZone: this.userTimeZone,
                eventTooltipController: this._eventTooltipController,
                onEventDrop: (info) => {
                    const taskId = info.event.id;
                    const newDeadline = resolveNewDeadline(info); // New deadline after the drop (Date object)

                    this.runWireAction(
                        wire.updateTaskDeadline(
                            taskId,
                            formatForServer(newDeadline),
                        ),
                        {
                            onFailure: () => info.revert(),
                        },
                    );
                },
                onDateClick: (info) => {
                    const clicked = info.date;
                    let deadline;

                    if (info.view.type === "dayGridMonth") {
                        const today = new Date();
                        const todayDateOnly = new Date(
                            today.getFullYear(),
                            today.getMonth(),
                            today.getDate(),
                        );
                        const isPast = clicked < todayDateOnly;
                        // Past dates: fixed to 0:00 / today or later: combine with the current time
                        deadline = combineDateAndTime(
                            clicked,
                            isPast ? null : new Date(),
                        );
                    } else {
                        // Week view: use the clicked time slot as-is (no combining needed)
                        deadline = clicked;
                    }

                    wire.$dispatchTo("task-modal", "open-task-modal", {
                        taskId: null, // When null, task-modal treats it as create mode
                        prefillDeadline: formatForServer(deadline),
                    });
                },
                onDatesSet: (info) => {
                    const viewType = info.view.type;
                    if (this.datePickerViewType !== viewType) {
                        // Switching between dayGridMonth ⇔ timeGridWeek: rebuild flatpickr
                        this.initFlatPickr(viewType);
                    } else if (this._skipDatePickerSync) {
                        // gotoDate was triggered by flatpickr's own selection,
                        // so skip to avoid overwriting the picked date with the week start
                    } else {
                        // Navigation via prev/next/today buttons: sync the displayed value
                        this.syncDatePicker(info.view.currentStart);
                    }
                    // On view switch FullCalendar rebuilds its DOM, so rewire
                    // observers and the overlay attach point to the latest state
                    this.observeCalendarLayout();
                    this.attachOverlayToHarness();
                    if (viewType === "timeGridWeek") {
                        // Keep some schedule above the now indicator when
                        // entering (or navigating) a week
                        this.calendar.scrollToTime(
                            resolveWeekScrollTime(
                                info.start,
                                info.end,
                                new Date(),
                            ),
                        );
                    }
                    this.runWireAction(
                        wire.loadEvents(
                            info.start.toISOString(),
                            info.end.toISOString(),
                        ),
                    );
                },
                onEventClick: (info) => {
                    info.jsEvent.preventDefault();
                    const actionTrigger = info.jsEvent.target.closest(
                        ".fc-event-actions-trigger",
                    );
                    if (actionTrigger) {
                        // Regardless of view width, ⋮ opens the context menu and the event body opens the modal
                        this.openContextMenu(
                            info.jsEvent,
                            info.event,
                            actionTrigger,
                        );
                        return;
                    }

                    const taskId = info.event.id;
                    if (!taskId) return;
                    wire.$dispatchTo("task-modal", "open-task-modal", {
                        taskId: Number(taskId),
                    });
                },
                onEventContextMenu: (jsEvent, event) => {
                    this.openContextMenu(jsEvent, event);
                },
            }),
        );

        this.calendar.render();
        // Right after the first render, start watching the header height and attach the overlay to the harness
        this.observeCalendarLayout();
        this.attachOverlayToHarness();
    },

    syncResponsiveView() {
        if (!this.calendar) return;

        const isMobile = window.innerWidth <= MOBILE_CALENDAR_MAX_WIDTH;
        const dayMaxEvents = getDayMaxEvents();
        const dayHeaderFormat = getDayHeaderFormat();
        const calendarHeight = getCalendarHeight();
        if (this.calendar.getOption("dayMaxEvents") !== dayMaxEvents) {
            this.calendar.setOption("dayMaxEvents", dayMaxEvents);
        }
        if (
            this.calendar.getOption("dayHeaderFormat")?.weekday !==
            dayHeaderFormat.weekday
        ) {
            this.calendar.setOption("dayHeaderFormat", dayHeaderFormat);
        }
        if (this.calendar.getOption("height") !== calendarHeight) {
            this.calendar.setOption("height", calendarHeight);
        }

        const weekButton = this.$el?.querySelector(
            ".fc-timeGridWeek-button",
        );
        if (weekButton) {
            weekButton.disabled = isMobile;
            weekButton.style.display = isMobile ? "none" : "";
            weekButton.setAttribute("aria-hidden", String(isMobile));
            weekButton.tabIndex = isMobile ? -1 : 0;
        }

        if (isMobile && this.calendar.view.type === "timeGridWeek") {
            this.calendar.changeView("dayGridMonth");
        }
    },

    removeCalendarMouseDownListener() {
        if (!this._calendarEl || !this._onCalendarMouseDown) return;

        this._calendarEl.removeEventListener(
            "mousedown",
            this._onCalendarMouseDown,
            true,
        );
        this._calendarEl = null;
        this._onCalendarMouseDown = null;
    },

    /**
     * Re-attach the loading overlay (x-ref="tableOverlay") as a child of .fc-view-harness
     * (the table body part excluding FullCalendar's toolbar, on which FullCalendar
     * itself applies position:relative).
     * This lets the overlay align precisely with the area excluding the toolbar
     * (prev/next, title, view switch) using only CSS absolute inset-0, without
     * pixel calculations via getBoundingClientRect or ResizeObserver following.
     * FullCalendar may rebuild .fc-view-harness on view switch, so call this
     * at every timing where the harness is (re)generated (after renderCalendar(),
     * at datesSet, etc.). Does nothing if already attached.
     */
    attachOverlayToHarness() {
        const calendarEl = this.$el?.querySelector("#task-calendar");
        const overlayEl = this.$refs?.tableOverlay;
        attachCalendarOverlay(calendarEl, overlayEl);
    },
    /**
     * Watch for toolbar height changes and calendar width changes, and
     * update the header height via the layout module on every change.
     * FullCalendar rebuilds the relevant DOM on view switch, so rewire
     * the observed targets on every call (disconnect → observe).
     * The loading overlay position is handled separately by attachOverlayToHarness()
     * (it follows via CSS absolute inset-0 only), so it is not handled here.
     */
    observeCalendarLayout() {
        const calendarEl = this.$el?.querySelector("#task-calendar");
        if (!calendarEl) return;

        this._layoutResizeObserver?.disconnect();
        this._layoutResizeObserver = createCalendarLayoutObserver(calendarEl);
    },
    /**
     * Show isLoading only when still processing after LOADING_DELAY_MS has elapsed
     */
    startLoading() {
        return this._loadingState.start();
    },

    /**
     * Wraps wire method calls with common handling.
     * @param {Promise<boolean>} promise - Return value of wire.xxx()
     * @param {object} [options]
     * @param {() => void} [options.onFailure] - Extra handling on failure (false or exception), e.g. info.revert()
     */
    async runWireAction(promise, { onFailure } = {}) {
        const stopLoading = this.startLoading();
        try {
            const success = await promise;
            if (!success) {
                onFailure?.();
                this.notifyError(
                    "The operation failed. You may lack the necessary permissions, or the target may no longer exist.",
                );
            }
        } catch (e) {
            onFailure?.();
            this.notifyError(
                "A communication error occurred. Please try again.",
            );
        } finally {
            stopLoading();
        }
    },

    /**
     * Error notification
     */
    notifyError(message) {
        this.errorMessage = message;
        this.$flux.modal("error-notification").show();
    },
    /**
     * Open the right-click context menu
     */
    openContextMenu(jsEvent, event, trigger = null) {
        const props = event.extendedProps || {};
        const triggerBounds = trigger?.getBoundingClientRect();
        this.contextMenu = {
            visible: true,
            x: triggerBounds
                ? Math.min(triggerBounds.right, Math.max(0, window.innerWidth - 176))
                : jsEvent.clientX,
            y: triggerBounds
                ? Math.min(triggerBounds.bottom, Math.max(0, window.innerHeight - 96))
                : jsEvent.clientY,
            taskId: event.id,
            isCompleted: !!props.completed,
        };
        if (trigger) {
            requestAnimationFrame(() =>
                this.$refs.contextMenuFirstAction?.focus(),
            );
        }
    },

    closeContextMenu() {
        this.contextMenu.visible = false;
    },
    /**
     * Toggle completion
     */
    toggleTaskCompletion() {
        const taskId = this.contextMenu.taskId;
        this.closeContextMenu();
        if (!taskId) return;
        this.runWireAction(wire.toggleTaskCompletion(taskId));
    },
    /**
     * Delete the task
     */
    deleteTaskFromMenu() {
        const taskId = this.contextMenu.taskId;
        this.closeContextMenu();
        if (!taskId) return;
        this.runWireAction(wire.deleteTask(taskId));
    },
    /**
     * Show a message when there are no events
     * @param {boolean} show false when events exist, true when none
     * @returns {void}
     */
    toggleNoEventsMessage(show) {
        const calendarEl = this.$el.querySelector("#task-calendar");
        if (!calendarEl) return;

        const existing = calendarEl.querySelector(".fc-no-events-overlay");
        // Match the copy to the period the calendar is currently showing
        const isWeek = this.calendar?.view.type === "timeGridWeek";
        const period = isWeek ? "week" : "month";

        if (!show) {
            existing?.remove();
            return;
        }

        if (existing) {
            // Refresh the copy when the visible period changed (e.g. week ⇔ month)
            if (existing.dataset.period !== period) {
                existing.dataset.period = period;
                existing.querySelector(".fc-no-events-overlay__title").textContent =
                    `No deadline tasks this ${period}.`;
                existing.querySelector(".fc-no-events-overlay__sub").textContent =
                    `Try a different ${period} or adjust your filters.`;
            }
            return;
        }

        const overlay = document.createElement("div");
        overlay.className = "fc-no-events-overlay";
        overlay.dataset.period = period;
        overlay.innerHTML = /* HTML */ `
            <div class="fc-no-events-overlay__icon">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#71717a"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                >
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <path d="M16 2v4M8 2v4M3 10h18" />
                    <line
                        x1="8"
                        y1="15"
                        x2="16"
                        y2="15"
                        stroke-dasharray="2 2"
                    />
                </svg>
            </div>
            <p class="fc-no-events-overlay__title">
                No deadline tasks this ${period}.
            </p>
            <p class="fc-no-events-overlay__sub">
                Try a different ${period} or adjust your filters.
            </p>
        `;
        calendarEl.appendChild(overlay);
    },
    jumpToDate(value) {
        // value is in "2026-06" format
        if (!this.calendar || !value) return;
        const target = value.length === 7 ? value + "-01" : value;
        // In the datesSet fired by this gotoDate, avoid overwriting the date
        // currently shown by flatpickr with currentStart (week start date)
        this._skipDatePickerSync = true;
        this.calendar.gotoDate(target);
    },
});
