function partsInTimeZone(instant, timeZone) {
    const parts = new Intl.DateTimeFormat("en-US", {
        timeZone,
        calendar: "iso8601",
        numberingSystem: "latn",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hourCycle: "h23",
    }).formatToParts(instant);

    return Object.fromEntries(
        parts
            .filter(({ type }) => type !== "literal")
            .map(({ type, value }) => [type, Number(value)]),
    );
}

function wallTimeAsUtc(parts) {
    const date = new Date(0);
    date.setUTCFullYear(parts.year, parts.month - 1, parts.day);
    date.setUTCHours(parts.hour, parts.minute, parts.second ?? 0, 0);

    return date.getTime();
}

export function getUserTimeZone() {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

export function isoToDateTimeLocal(isoString, timeZone) {
    if (!isoString) return "";

    const parts = partsInTimeZone(new Date(isoString), timeZone);
    const pad = (value) => String(value).padStart(2, "0");

    return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}T${pad(parts.hour)}:${pad(parts.minute)}`;
}

export function dateTimeLocalToIso(value, timeZone) {
    const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
    if (!match) return null;

    const [, year, month, day, hour, minute] = match.map(Number);
    const requested = { year, month, day, hour, minute, second: 0 };
    const requestedAsUtc = wallTimeAsUtc(requested);
    const normalized = partsInTimeZone(new Date(requestedAsUtc), "UTC");

    if (
        normalized.year !== year ||
        normalized.month !== month ||
        normalized.day !== day ||
        normalized.hour !== hour ||
        normalized.minute !== minute
    ) {
        return null;
    }

    const offsets = new Set();
    for (let hours = -48; hours <= 48; hours += 6) {
        const instant = requestedAsUtc + hours * 60 * 60 * 1000;
        offsets.add(
            wallTimeAsUtc(partsInTimeZone(new Date(instant), timeZone)) -
                instant,
        );
    }

    const candidates = [...offsets].map((offset) => {
        const instant = requestedAsUtc - offset;

        return {
            instant,
            difference:
                wallTimeAsUtc(partsInTimeZone(new Date(instant), timeZone)) -
                requestedAsUtc,
        };
    });

    const exactMatches = candidates
        .filter(({ difference }) => difference === 0)
        .sort((first, second) => first.instant - second.instant);

    if (exactMatches.length) {
        // During a fall-back overlap, choose the earlier of the two instants.
        return new Date(exactMatches[0].instant).toISOString();
    }

    const afterGap = candidates
        .filter(({ difference }) => difference > 0)
        .sort(
            (first, second) =>
                first.difference - second.difference ||
                first.instant - second.instant,
        )[0];

    // During a spring-forward gap, move forward by the size of the gap.
    return afterGap ? new Date(afterGap.instant).toISOString() : null;
}

export default (wire) => ({
    wire,
    timeZone: getUserTimeZone(),

    init() {
        this.$watch(
            () => this.wire.form.deadline,
            (value) => this.updateLocalValue(value),
        );
        this.updateLocalValue(this.wire.form.deadline);
    },

    updateLocalValue(isoString) {
        this.$refs.deadline.value = isoToDateTimeLocal(
            isoString,
            this.timeZone,
        );
    },

    update(value) {
        this.wire.set(
            "form.deadline",
            dateTimeLocalToIso(value, this.timeZone),
        );
    },
});
