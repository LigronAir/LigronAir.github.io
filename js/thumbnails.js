import { getAccessToken } from "./session.js";

const base = "https://api.ligronair.tv/api/v1/thumbnails";
const keyOf = t => JSON.stringify([t.kind, t.device_uuid, t.source_id ?? null]);
const batchStorageKey = "ligronPoolThumbnailBatch";
const labels = {
    PENDING: "Pendiente", FAILED: "Captura fallida", EXPIRED: "Captura caducada",
    INVALIDATED: "Captura invalidada", READY: ""
};

export function createThumbnails(notice) {
    let controller;
    let timer;
    let cards = new Map();
    const previous = new Map();
    const images = new Map();

    function savedBatch() {
        try { return sessionStorage.getItem(batchStorageKey); } catch { return null; }
    }

    function saveBatch(batchId) {
        try { sessionStorage.setItem(batchStorageKey, batchId); } catch { /* sesión no persistente */ }
    }

    function forgetBatch() {
        try { sessionStorage.removeItem(batchStorageKey); } catch { /* sesión no persistente */ }
    }

    function prune() {
        const used = new Set(previous.values());
        for (const [id, image] of images) {
            if (used.has(image)) continue;
            URL.revokeObjectURL(image.url);
            images.delete(id);
        }
    }

    function draw(card, status = "") {
        const image = previous.get(keyOf(card.target));
        const lines = [];
        const node = card.node;
        node.replaceChildren();
        if (image) {
            const img = document.createElement("img");
            img.src = image.url;
            img.alt = "Miniatura de " + image.origin;
            img.draggable = false;
            node.append(img);
            const seconds = Math.max(0, Math.floor((Date.now() - image.time) / 1000));
            lines.push(image.origin, new Date(image.time).toLocaleTimeString() + " · hace " + seconds + " s");
        } else if (!status) {
            lines.push("Sin miniatura");
        }
        if (status) lines.push(status);
        const caption = document.createElement("span");
        caption.textContent = lines.join(" · ");
        node.append(caption);
    }

    function begin() {
        controller?.abort();
        clearTimeout(timer);
        controller = new AbortController();
        return controller.signal;
    }

    function bind(entries) {
        cards = new Map(entries.map(card => [keyOf(card.target), card]));
        for (const key of previous.keys()) if (!cards.has(key)) previous.delete(key);
        prune();
        notice.textContent = "";
        cards.forEach(card => draw(card));
    }

    async function refresh(signal, resume = false) {
        // Las vías Native comienzan plegadas. Su preview no tiene rectángulo
        // visible hasta abrir la caja, pero continúa siendo un destino válido
        // de una actualización solicitada desde Pool.
        const eligible = [...cards.values()].filter(card => card.eligible);
        const selected = eligible.slice(0, 10);
        if (!selected.length) return;
        if (eligible.length > 10) notice.textContent = "Se solicitan los primeros 10 destinos disponibles.";
        const deadline = performance.now() + 30000;
        let pending = new Set(selected);
        if (!resume) selected.forEach(card => draw(card, labels.PENDING));

        async function request(path, options = {}) {
            const response = await fetch(base + path, {
                ...options, signal, cache: "no-store", redirect: "error",
                headers: { ...options.headers, Authorization: "Bearer " + getAccessToken() }
            });
            if (!response.ok) throw Object.assign(new Error(), { status: response.status });
            return response;
        }

        function failure(error, affected) {
            if (signal.aborted) return;
            const unavailable = error.status === 503;
            const rateLimited = error.status === 429;
            if (unavailable) notice.textContent = "Miniaturas temporalmente no disponibles.";
            if (rateLimited) notice.textContent = "Otra sesión Pool ya está actualizando las miniaturas.";
            for (const card of affected) draw(card,
                unavailable ? "" : rateLimited ? "Actualización en otra sesión" : labels.FAILED);
        }

        async function apply(batch) {
            const targets = new Map(batch.targets.map(t => [keyOf(t), t.capture_id]));
            const groups = new Map();
            for (const card of pending) {
                const id = targets.get(keyOf(card.target));
                if (!groups.has(id)) groups.set(id, []);
                groups.get(id).push(card);
            }
            await Promise.all([...groups].map(async ([id, group]) => {
                const capture = batch.captures.find(item => item.capture_id === id);
                const state = capture?.state;
                if (state === "PENDING") return;
                group.forEach(card => pending.delete(card));
                try {
                    if (state === "READY") {
                        let image = images.get(id);
                        if (!image) {
                            const response = await request("/captures/" + encodeURIComponent(id) + "/image");
                            const blob = await response.blob();
                            if (signal.aborted) return;
                            if (blob.type !== "image/jpeg" || !blob.size) throw new Error();
                            const producer = capture.producer === "native_box" ? "Caja " + capture.source_id : "Pi";
                            image = { url: URL.createObjectURL(blob), origin: producer + " · " + capture.producer_device_uuid,
                                time: capture.captured_at_ms ?? capture.received_at_ms ?? Date.now() };
                            images.set(id, image);
                        }
                        group.forEach(card => previous.set(keyOf(card.target), image));
                    }
                    group.forEach(card => draw(card, labels[state] ?? labels.FAILED));
                } catch (error) {
                    failure(error, group);
                }
            }));
            if (!signal.aborted) prune();
        }

        async function consume(response, polls) {
            const batch = await response.json();
            if (signal.aborted) return;
            if (resume && polls === 0) {
                const requested = new Set(batch.targets.map(keyOf));
                pending = new Set(selected.filter(card => requested.has(keyOf(card.target))));
                pending.forEach(card => draw(card, labels.PENDING));
            }
            await apply(batch);
            if (!pending.size) {
                forgetBatch();
                return;
            }
            if (signal.aborted || polls === 3) return;
            const delay = polls ? 10000 : 4000;
            if (performance.now() + delay >= deadline) return;
            timer = setTimeout(async () => {
                if (signal.aborted || performance.now() >= deadline) return;
                try {
                    await consume(await request("/requests/" + encodeURIComponent(batch.batch_id)), polls + 1);
                } catch (error) {
                    failure(error, pending);
                }
            }, delay);
        }

        try {
            const batchId = resume ? savedBatch() : null;
            if (resume && !batchId) return;
            const response = batchId
                ? await request("/requests/" + encodeURIComponent(batchId))
                : await request("/requests", {
                    method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": crypto.randomUUID() },
                    body: JSON.stringify({ targets: selected.map(card => card.target) })
                });
            if (!batchId) {
                const batch = await response.clone().json();
                saveBatch(batch.batch_id);
            }
            await consume(response, 0);
        } catch (error) {
            if (resume && error.status === 404) forgetBatch();
            failure(error, pending);
        }
    }

    function dispose() {
        begin();
        previous.clear();
        prune();
        cards.forEach(card => draw(card));
        cards.clear();
    }

    return {
        begin, bind, refresh,
        resume: signal => refresh(signal, true),
        dispose,
        redraw: () => cards.forEach(card => draw(card))
    };
}
