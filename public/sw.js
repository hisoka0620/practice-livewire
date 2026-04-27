self.addEventListener("push", function (event) {
    const DEFAULT_PAYLOAD = {
        title: "Task Reminder",
        body: "You have tasks that are due or due soon.",
        icon: "/favicon.ico",
        tag: "task-reminder",
        data: {},
    };

    let payload = DEFAULT_PAYLOAD;

    try {
        payload = event.data ? event.data.json() : DEFAULT_PAYLOAD;
    } catch (e) {
        payload = DEFAULT_PAYLOAD;
    }

    const title = payload.title || DEFAULT_PAYLOAD.title;
    const options = {
        body: payload.body || DEFAULT_PAYLOAD.body,
        data: payload.data || DEFAULT_PAYLOAD.data,
        icon: payload.icon || DEFAULT_PAYLOAD.icon,
        tag: payload.tag || DEFAULT_PAYLOAD.tag,
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", function (event) {
    event.notification.close();

    const notificationUrl = event.notification.data?.url || "/todo-list";
    const urlToOpen = new URL(notificationUrl, self.location.origin).href;

    event.waitUntil(
        clients
            .matchAll({ type: "window", includeUncontrolled: true })
            .then((windowClients) => {
                for (const client of windowClients) {
                    if (new URL(client.url).href === urlToOpen) {
                        return client.focus();
                    }
                }

                return clients.openWindow(urlToOpen);
            }),
    );
});
