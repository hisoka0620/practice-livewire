self.addEventListener("push", function (event) {
    let payload = {};

    try {
        payload = event.data ? event.data.json() : {};
    } catch (e) {
        payload = { title: "Task Reminder", body: "You have tasks due soon." };
    }

    const title = payload.title || "Task Reminder";
    const options = {
        body: payload.body || "You have tasks that are due or due soon.",
        data: payload.data || {},
        tag: payload.tag || "task-reminder",
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", function (event) {
    event.notification.close();

    const url = event.notification.data?.url || "/";
        console.log(clients);

    event.waitUntil(
        clients
            .matchAll({ type: "window", includeUncontrolled: true })
            .then((windowClients) => {
                for (let client of windowClients) {
                    if (client.url === url && "focus" in client) {
                        return client.focus();
                    }
                }
                if (clients.openWindow) {
                    return clients.openWindow(url);
                }
            }),
    );
});
