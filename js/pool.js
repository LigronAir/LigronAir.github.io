// ==========================================================
// LigronLink · Pool
// Snapshot/manual refresh. It deliberately does not poll D1.
// ==========================================================

import { getUser } from "./session.js";
import { loadDevices } from "./deviceApi.js";

const API = "https://api.ligronair.tv/api/v1";
const user = getUser();
const notice = document.getElementById("poolNotice");
const piList = document.getElementById("poolPiList");
const nativeList = document.getElementById("poolNativeList");
const piCount = document.getElementById("poolPiCount");
const nativeCount = document.getElementById("poolNativeCount");
const refreshButton = document.getElementById("poolRefreshButton");
let draggedPi = null;

if (!user) window.location.href = "login.html";

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function isPi(device) {
    return String(device?.tipo || "").toLowerCase().includes("ligronpi");
}

function isNative(device) {
    return String(device?.tipo || "").toLowerCase().includes("ligronair");
}

function present(device) {
    return String(device?.estado || "").toUpperCase() === "ONLINE";
}

function setNotice(text, style = "") {
    notice.textContent = text;
    notice.className = `pool-notice${style ? ` ${style}` : ""}`;
}

function receiverStatus(receiver) {
    return String(receiver?.state || "OFFLINE").toUpperCase();
}

function piTelemetry(device) {
    const telemetry = device.runtime_status?.telemetry || {};
    const parts = [];
    if (telemetry.cpu_percent !== undefined) parts.push(`CPU ${telemetry.cpu_percent}%`);
    if (telemetry.temperature_c !== undefined) parts.push(`${telemetry.temperature_c} °C`);
    if (telemetry.network_tx_kbps !== undefined) parts.push(`↑ ${telemetry.network_tx_kbps} kb/s`);
    if (device.runtime_status?.runtime_state) parts.push(device.runtime_status.runtime_state);
    return parts.length ? parts.join(" · ") : "Telemetría pendiente de la próxima presencia.";
}

function piRoute(device) {
    const runtime = device.runtime_status;
    if (!runtime?.target_label) return "Disponible para ser reclamada desde Pool.";
    return runtime.streaming
        ? `Emitiendo hacia ${runtime.target_label}`
        : `Asignada a ${runtime.target_label}`;
}

function renderPis(devices) {
    const pis = devices.filter(isPi);
    piCount.textContent = String(pis.length);
    if (!pis.length) {
        piList.innerHTML = '<div class="pool-empty">No hay LigronPi registradas en esta cuenta.</div>';
        return;
    }
    piList.innerHTML = pis.map((pi) => {
        const online = present(pi);
        const alias = escapeHtml(pi.alias || "LigronPi");
        return `
            <article class="pool-pi ${online ? "" : "offline"}" data-pi-uuid="${escapeHtml(pi.uuid)}" draggable="${online ? "true" : "false"}">
                <div class="pool-preview">MINIATURA<br>PRÓXIMAMENTE</div>
                <div>
                    <div class="pool-pi-title">${alias}</div>
                    <div class="pool-pi-detail">${escapeHtml(piRoute(pi))}</div>
                    <span class="pool-state ${online ? "online" : "offline"}">${online ? "PRESENTE · RECLAMABLE" : "SIN PRESENCIA"}</span>
                    <div class="pool-pi-telemetry">${escapeHtml(piTelemetry(pi))}</div>
                </div>
            </article>`;
    }).join("");

    piList.querySelectorAll("[draggable='true']").forEach((card) => {
        card.addEventListener("dragstart", (event) => {
            draggedPi = pis.find((pi) => pi.uuid === card.dataset.piUuid) || null;
            if (!draggedPi) return;
            card.classList.add("dragging");
            event.dataTransfer.effectAllowed = "copy";
            event.dataTransfer.setData("text/plain", draggedPi.uuid);
        });
        card.addEventListener("dragend", () => {
            card.classList.remove("dragging");
            draggedPi = null;
        });
    });
}

function receiverOwner(receiver, status) {
    if (receiver.reserved_by_alias && (status === "RESERVED" || status === "BUSY")) {
        return `${status === "BUSY" ? "En uso" : "Reservada"} por ${receiver.reserved_by_alias}`;
    }
    if (status === "BUSY") return "Origen externo o local · no sustituible desde Pool";
    if (status === "RESERVED") return "Reserva Link sin alias · requiere revisión";
    return "";
}

function renderNatives(devices) {
    const natives = devices.filter(isNative);
    nativeCount.textContent = String(natives.length);
    if (!natives.length) {
        nativeList.innerHTML = '<div class="pool-empty">No hay LigronAir Native registrados en esta cuenta.</div>';
        return;
    }
    nativeList.innerHTML = natives.map((native) => {
        const online = present(native);
        const receivers = Array.isArray(native.srt_receiver_list) ? native.srt_receiver_list : [];
        const summary = online
            ? `${receivers.length} vía(s) publicadas · ${Number(native.srt_receivers?.free || 0)} libre(s)`
            : "Sin presencia: las vías no son operativas";
        const vias = receivers.map((receiver) => {
            const state = receiverStatus(receiver);
            const canDrop = online && (state === "FREE" || state === "RESERVED");
            const owner = receiverOwner(receiver, state);
            return `
                <div class="pool-via ${state.toLowerCase()}" data-native-uuid="${escapeHtml(native.uuid)}" data-source-id="${Number(receiver.source_id)}" data-droppable="${canDrop ? "true" : "false"}">
                    <div class="pool-via-title"><span>${escapeHtml(receiver.name || `VÍA ${receiver.source_id}`)}</span><span class="pool-state ${state.toLowerCase()}">${escapeHtml(state)}</span></div>
                    <div class="pool-via-status">Puerto ${escapeHtml(receiver.port)} · ${escapeHtml(receiver.mode || "listener")}</div>
                    ${owner ? `<div class="pool-via-owner">${escapeHtml(owner)}</div>` : ""}
                    <div class="pool-via-endpoint">${escapeHtml(receiver.host || "endpoint pendiente")}:${escapeHtml(receiver.port || "—")}</div>
                </div>`;
        }).join("") || '<div class="pool-empty">Este Native todavía no ha publicado vías SRT.</div>';
        return `
            <article class="pool-native ${online ? "" : "offline"}" data-native-card="${escapeHtml(native.uuid)}">
                <button class="pool-native-toggle" type="button" aria-expanded="false">
                    <span><span class="pool-native-name">${escapeHtml(native.alias || "LigronAir Native")}</span><span class="pool-native-detail">${escapeHtml(summary)}</span></span>
                    <span class="pool-native-chevron">⌄</span>
                </button>
                <div class="pool-native-vias">${vias}</div>
            </article>`;
    }).join("");

    nativeList.querySelectorAll(".pool-native-toggle").forEach((button) => {
        button.addEventListener("click", () => {
            const card = button.closest(".pool-native");
            const open = card.classList.toggle("open");
            button.setAttribute("aria-expanded", String(open));
        });
    });
    nativeList.querySelectorAll("[data-droppable='true']").forEach((via) => {
        via.addEventListener("dragover", (event) => {
            if (!draggedPi) return;
            event.preventDefault();
            event.dataTransfer.dropEffect = "copy";
            via.classList.add("drop-target");
        });
        via.addEventListener("dragleave", () => via.classList.remove("drop-target"));
        via.addEventListener("drop", async (event) => {
            event.preventDefault();
            via.classList.remove("drop-target");
            const pi = draggedPi;
            if (!pi) return;
            const native = devices.find((item) => item.uuid === via.dataset.nativeUuid);
            const receiver = (native?.srt_receiver_list || []).find(
                (item) => Number(item.source_id) === Number(via.dataset.sourceId)
            );
            await requestClaim(pi, native, receiver);
        });
    });
}

async function postClaim(pi, native, receiver, replace = false) {
    const response = await fetch(`${API}/pool/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            email: user.email,
            pi_uuid: pi.uuid,
            native_uuid: native.uuid,
            source_id: Number(receiver.source_id),
            replace
        })
    });
    let payload;
    try { payload = await response.json(); } catch { payload = {}; }
    return { response, payload };
}

async function requestClaim(pi, native, receiver) {
    if (!native || !receiver) return;
    setNotice(`Solicitando ${pi.alias || "LigronPi"} → ${native.alias || "LigronAir"} · vía ${receiver.source_id}…`);
    try {
        let { response, payload } = await postClaim(pi, native, receiver);
        if (payload.approval_required) {
            const current = payload.current_owner_alias || "la fuente actual";
            const accepted = window.confirm(
                `La vía está reservada por ${current}.\n\nAl confirmar, Link ordenará detener esa Pi y sólo después reclamará la vía para ${pi.alias || "la nueva Pi"}. ¿Autorizar sustitución?`
            );
            if (!accepted) {
                setNotice("Sustitución cancelada: la fuente actual conserva su vía.");
                return;
            }
            ({ response, payload } = await postClaim(pi, native, receiver, true));
        }
        if (!response.ok || !payload.success) throw new Error(payload.error || "Pool no pudo crear la operación.");
        setNotice(payload.message || "Operación Pool solicitada; esperando ACK de las Pi.", "success");
        // The server snapshot is refreshed only after an operator action.
        // There is no automatic progress polling against D1.
    } catch (error) {
        setNotice(String(error?.message || error), "error");
    }
}

async function refresh() {
    refreshButton.disabled = true;
    try {
        setNotice("Leyendo una fotografía actual de Link…");
        const { devices } = await loadDevices();
        renderPis(devices);
        renderNatives(devices);
        setNotice(`Fotografía cargada: ${devices.length} equipos. Actualiza manualmente para consultar cambios.`, "success");
    } catch (error) {
        setNotice(String(error?.message || error), "error");
    } finally {
        refreshButton.disabled = false;
    }
}

refreshButton?.addEventListener("click", refresh);
refresh();
