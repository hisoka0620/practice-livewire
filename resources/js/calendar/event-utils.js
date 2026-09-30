export function processEventsByView(events, currentView) {
    if (!events.length) {
        return events;
    }

    return events.map((event) => {
        if (currentView === "dayGridMonth") {
            return {
                ...event,
                allDay: true,
                start: event.start,
                end: null,
            };
        }

        if (currentView === "timeGridWeek" && event.start) {
            return {
                ...event,
                allDay: false,
                start: new Date(event.start),
                end: null,
            };
        }

        return event;
    });
}
