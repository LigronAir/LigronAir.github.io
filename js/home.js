// ==========================================================
// LigronLink
// Home
// ==========================================================

import { getUser } from "./session.js";
import { openDeviceRegisterDialog } from "./deviceRegister.js";
import {
    loadDevices,
    deleteDevice
} from "./deviceApi.js";

console.log("HOME CARGADO");

const user = getUser();

if (!user) {

    window.location.href = "login.html";

}
else {

    console.log("Bienvenido", user.nombre);

}

// ==========================================================
// ### FIX
// Escapar HTML
// ==========================================================

function escapeHtml(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}

// ==========================================================
// ### FIX
// Obtener nombre amigable del tipo de equipo
// ==========================================================

function getDeviceTypeName(type) {

    switch ((type || "").toLowerCase()) {

        case "ligronair":

            return "LigronAir Native";

        case "ligronpi":

            return "LigronPi";

        default:

            return type || "Equipo";

    }

}

// ==========================================================
// ### FIX
// Formatear fecha de registro
// ==========================================================

function formatDate(value) {

    if (!value) {

        return "—";

    }

    const date = new Date(
        String(value).replace(" ", "T")
    );

    if (Number.isNaN(date.getTime())) {

        return value;

    }

    return new Intl.DateTimeFormat(
        "es-ES",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        }
    ).format(date);

}

// ==========================================================
// ### FIX
// Renderizar resumen de receptores SRT
// ==========================================================

function renderSrtSummary(device) {

    const summary =
        device.srt_receivers;

    if (!summary || Number(summary.total || 0) <= 0) {

        return `

            <div class="srt-summary empty">

                Sin receptores

            </div>

        `;

    }

    const total =
        Number(summary.total || 0);

    const free =
        Number(summary.free || 0);

    const busy =
        Number(summary.busy || 0);

    const reserved =
        Number(summary.reserved || 0);

    const offline =
        Number(summary.offline || 0);

    return `

        <div
            class="srt-summary"
            title="SRT: ${free} libres · ${busy} ocupados · ${reserved} reservados · ${offline} offline">

            <span class="srt-chip free">
                L ${free}
            </span>

            <span class="srt-chip busy">
                O ${busy}
            </span>

            <span class="srt-chip reserved">
                R ${reserved}
            </span>

            <span class="srt-total">
                / ${total}
            </span>

        </div>

    `;

}

// ==========================================================
// ### FIX
// Renderizar estado runtime publicado por Pi/Native
// ==========================================================

function renderRuntimeStatus(device) {

    const runtime =
        device.runtime_status;

    if (!runtime) {

        return "";

    }

    const state =
        String(runtime.runtime_state || "OFFLINE").toUpperCase();

    const target =
        runtime.target_label ||
        runtime.target_srt_url ||
        "";

    const source =
        runtime.source_label || "";

    return `

        <span class="runtime-pill ${escapeHtml(state.toLowerCase())}">

            ${escapeHtml(state)}

        </span>

        <span class="runtime-line">

            ${escapeHtml(source)}

        </span>

        ${
            target
                ? `
                    <span class="runtime-line target">
                        → ${escapeHtml(target)}
                    </span>
                `
                : ""
        }

    `;

}

// ==========================================================
// LigronTail: Link explica la ruta sin exponer su mecánica.
// ==========================================================

function isPi(device) {
    return String(device.tipo || "").trim().toLowerCase()
        .includes("ligronpi");
}

function isNative(device) {
    return String(device.tipo || "").trim().toLowerCase()
        .includes("ligronair");
}

function samePrivateLan(left, right) {
    const parse = value => String(value || "").split(".").map(Number);
    const a = parse(left);
    const b = parse(right);
    const valid = value => value.length === 4 && value.every(part => Number.isInteger(part) && part >= 0 && part <= 255);
    const privateV4 = value => value[0] === 10 || (value[0] === 172 && value[1] >= 16 && value[1] <= 31) || (value[0] === 192 && value[1] === 168);
    return valid(a) && valid(b) && privateV4(a) && privateV4(b)
        && a.slice(0, 3).join(".") === b.slice(0, 3).join(".");
}

function ligronTailState(device) {
    const network = device.network_status || {};
    if (network.tailscale_available && network.tailscale_ipv4_address && network.tailscale_tailnet) {
        return {
            label: "ACTIVO",
            tone: "ready",
            detail: `${network.tailscale_ipv4_address} · ${network.tailscale_tailnet}`
        };
    }
    const state = String(network.tailscale_state || "NO_REPORT").toUpperCase();
    const labels = {
        NOT_INSTALLED: "NO INSTALADO",
        NEEDSLOGIN: "SIN VINCULAR",
        NEEDS_LOGIN: "SIN VINCULAR",
        STOPPED: "SERVICIO DETENIDO",
        UNRESPONSIVE: "SIN RESPUESTA",
        NO_ADDRESS: "SIN DIRECCIÓN",
        NO_REPORT: "SIN INFORME"
    };
    return { label: labels[state] || state, tone: "not-ready", detail: "LigronTail" };
}

function routePlan(pi, native) {
    const piNetwork = pi.network_status || {};
    const nativeNetwork = native.network_status || {};
    const piOnline = String(pi.estado || "").toUpperCase() === "ONLINE";
    const nativeOnline = String(native.estado || "").toUpperCase() === "ONLINE";
    if (!piOnline || !nativeOnline) {
        return { label: "PENDIENTE", tone: "not-ready", detail: "Los dos equipos deben estar online en Link." };
    }
    if (piNetwork.tailscale_available && nativeNetwork.tailscale_available
        && piNetwork.tailscale_tailnet
        && String(piNetwork.tailscale_tailnet).toLowerCase() === String(nativeNetwork.tailscale_tailnet || "").toLowerCase()) {
        return {
            label: "LIGRONTAIL DIRECTO",
            tone: "ready",
            detail: `${piNetwork.tailscale_ipv4_address} → ${nativeNetwork.tailscale_ipv4_address}`
        };
    }
    if (samePrivateLan(piNetwork.ipv4_address, nativeNetwork.ipv4_address)) {
        return { label: "LAN DIRECTA", tone: "ready", detail: `${piNetwork.ipv4_address} → ${nativeNetwork.ipv4_address}` };
    }
    if (native.public_ip) {
        return {
            label: "IP PÚBLICA NO VALIDADA",
            tone: "not-ready",
            detail: `${native.public_ip}; Link no la usará sin una ruta comprobada.`
        };
    }
    return { label: "SIN RUTA", tone: "not-ready", detail: "Activa LigronTail en ambos equipos o conéctalos a la misma LAN." };
}

function renderLigronTailDeviceLine(device) {
    const tail = ligronTailState(device);
    return `
        <span class="device-ligron-tail ${tail.tone}">
            LigronTail: ${escapeHtml(tail.label)} · ${escapeHtml(tail.detail)}
        </span>`;
}

// ==========================================================
// ### FIX
// Renderizar detalle desplegable de receptores SRT
// ==========================================================

function renderReceiverDetails(device, devices) {

    const receivers =
        Array.isArray(device.srt_receiver_list)
            ? device.srt_receiver_list
            : [];

    const network = device.network_status || {};
    const tail = ligronTailState(device);
    const peers = isPi(device)
        ? devices.filter(isNative)
        : isNative(device)
            ? devices.filter(isPi)
            : [];
    const routes = peers.length
        ? peers.map(peer => {
            const pi = isPi(device) ? device : peer;
            const native = isNative(device) ? device : peer;
            const route = routePlan(pi, native);
            return `<span class="device-route ${route.tone}">${escapeHtml(peer.alias || getDeviceTypeName(peer.tipo))}: <strong>${escapeHtml(route.label)}</strong> · ${escapeHtml(route.detail)}</span>`;
        }).join("")
        : '<span class="device-route not-ready">No hay equipo complementario registrado en esta cuenta.</span>';
    const networkDetails = `
        <div class="receiver-network">
            <strong>Red sincronizada con LigronLink</strong>
            <span>Sincronización: ${escapeHtml(network.sync_state || "NO REPORTADA")}</span>
            <span>IP local: ${escapeHtml(network.ipv4_address || "—")}</span>
            <span>IP exterior: ${escapeHtml(device.public_ip || "—")}</span>
            <span>IPv6: ${escapeHtml(network.ipv6_address || "—")}</span>
            <span>LigronTail: ${escapeHtml(tail.label)} · ${escapeHtml(network.tailscale_ipv4_address || "—")}</span>
            <span>Tailnet: ${escapeHtml(network.tailscale_tailnet || "—")}</span>
            <span>Última presencia: ${escapeHtml(network.last_seen_at || "—")}</span>
            <div class="device-route-list"><strong>Rutas con equipos vinculados</strong>${routes}</div>
        </div>`;

    if (receivers.length === 0) {

        return `

            ${networkDetails}
            <div class="receiver-empty">

                Este equipo no ha publicado cajas/receptores SRT.

            </div>

        `;

    }

    return `

        ${networkDetails}
        <div class="receiver-grid">

            ${receivers.map(receiver => {

                const state =
                    String(receiver.state || "OFFLINE").toUpperCase();

                const label =
                    state === "FREE"
                        ? "Esperando"
                        : state === "BUSY"
                            ? "En uso"
                            : state === "RESERVED"
                                ? "Reservado"
                                : "Apagado";

                return `

                    <div class="receiver-card ${escapeHtml(state.toLowerCase())}">

                        <div class="receiver-card-head">

                            <span class="receiver-name">
                                ${escapeHtml(receiver.name || ("MOCHILA " + receiver.source_id))}
                            </span>

                            <span class="receiver-state">
                                ${escapeHtml(label)}
                            </span>

                        </div>

                        <div class="receiver-card-meta">

                            Puerto ${escapeHtml(receiver.port || "—")}
                            · ${escapeHtml(receiver.mode || "listener")}
                            · Endpoint: ${escapeHtml(receiver.host || "—")}

                        </div>

                    </div>

                `;

            }).join("")}

        </div>

    `;

}

// ==========================================================
// ### FIX
// Actualizar contadores
// ==========================================================

function updateCounters(devices) {

    const totalDevices =
        document.getElementById("totalDevices");

    const onlineDevices =
        document.getElementById("onlineDevices");

    const offlineDevices =
        document.getElementById("offlineDevices");

    const total =
        devices.length;

    const online =
        devices.filter(device =>
            String(device.estado || "")
                .toUpperCase() === "ONLINE"
        ).length;

    const offline =
        total - online;

    if (totalDevices) {

        totalDevices.textContent = total;

    }

    if (onlineDevices) {

        onlineDevices.textContent = online;

    }

    if (offlineDevices) {

        offlineDevices.textContent = offline;

    }

}

// ==========================================================
// ### FIX
// Eliminar equipo
// ==========================================================

async function removeDevice(device) {

    const confirmar = confirm(
        `¿Eliminar el equipo "${device.alias}"?`
    );

    if (!confirmar) {

        return;

    }

    try {

        await deleteDevice(device.id);

        alert("Equipo eliminado correctamente.");

        await refreshDashboard();

    }
    catch (error) {

        console.error(error);

        alert(error.message);

    }

}

// ==========================================================
// ### FIX
// Editar equipo
// ==========================================================

function editDevice(device) {

    alert(
        `Editar equipo pendiente: ${device.alias}`
    );

}

// ==========================================================
// ### FIX
// Renderizar listado de equipos
// ==========================================================

function renderDevices(devices) {

    const deviceList =
        document.getElementById("deviceList");

    if (!deviceList) {

        return;

    }

    deviceList.innerHTML = "";

    if (devices.length === 0) {

        deviceList.innerHTML = `

            <tr class="devices-empty-row">

                <td
                    colspan="7"
                    class="devices-empty-cell">

                    <div class="empty-state">

                        <h3>

                            Todavía no tienes equipos registrados

                        </h3>

                        <p>

                            Registra tu primer LigronAir Native
                            o Raspberry para comenzar a construir
                            tu red LigronLink.

                        </p>

                    </div>

                </td>

            </tr>

        `;

        return;

    }

    devices.forEach(device => {

        const row =
            document.createElement("tr");

        const detailRow =
            document.createElement("tr"); // ### FIX

        const status =
            String(device.estado || "OFFLINE")
                .toUpperCase();

        const friendlyType =
            getDeviceTypeName(device.tipo);

        row.className = "devices-row";

        row.innerHTML = `

            <td class="devices-cell status-cell" data-label="Estado">

                <div class="devices-status ${status.toLowerCase()}">

                    <span class="status-dot"></span>

                    <span class="status-label">

                        ${escapeHtml(status)}

                    </span>

                </div>

            </td>

            <td class="devices-cell name-cell" data-label="Nombre / Alias">

                <span class="device-main-name">

                    ${escapeHtml(friendlyType)}

                </span>

                <span class="device-main-alias">

                    ${escapeHtml(device.alias || "Sin alias")}

                </span>

                <span class="device-runtime">

                    ${renderRuntimeStatus(device)}

                </span>

                ${renderLigronTailDeviceLine(device)}

            </td>

            <td class="devices-cell type-cell" data-label="Tipo">

                ${escapeHtml(friendlyType)}

            </td>

            <td class="devices-cell srt-cell" data-label="SRT">

                ${renderSrtSummary(device)}

            </td>

            <td class="devices-cell uuid-cell"
                data-label="UUID"
                title="${escapeHtml(device.uuid || "—")}">

                ${escapeHtml(device.uuid || "—")}

            </td>

            <td class="devices-cell registered-cell" data-label="Registrado">

                ${escapeHtml(formatDate(device.fecha_creacion))}

            </td>

            <td class="devices-cell actions-cell" data-label="Acciones">

                <div class="devices-actions">

                    <button
                        type="button"
                        class="ligron-button receivers-button">

                        ${isNative(device) ? "Red y cajas" : "Red"}

                    </button>

                    <button
                        type="button"
                        class="ligron-button edit-button">

                        Editar

                    </button>

                    <button
                        type="button"
                        class="ligron-button delete-button">

                        Eliminar

                    </button>

                </div>

            </td>

        `;

        const editButton =
            row.querySelector(".edit-button");

        const deleteButton =
            row.querySelector(".delete-button");

        const receiversButton =
            row.querySelector(".receivers-button"); // ### FIX

        editButton.addEventListener("click", () => {

            editDevice(device);

        });

        deleteButton.addEventListener("click", () => {

            removeDevice(device);

        });

        deviceList.appendChild(row);

        detailRow.className = "receiver-detail-row hidden"; // ### FIX
        detailRow.innerHTML = `

            <td colspan="7" class="receiver-detail-cell">

                ${renderReceiverDetails(device, devices)}

            </td>

        `;

        receiversButton.addEventListener("click", () => {

            detailRow.classList.toggle("hidden");

        });

        deviceList.appendChild(detailRow);

    });

}

// ==========================================================
// ### FIX
// Actualizar hora del último refresco
// ==========================================================

function updateLastRefresh() {

    const lastRefresh =
        document.getElementById("lastRefresh");

    if (!lastRefresh) {

        return;

    }

    const now = new Date();

    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    const ss = String(now.getSeconds()).padStart(2, "0");

    lastRefresh.textContent = `${hh}:${mm}:${ss}`;

}

// ==========================================================
// ### FIX
// Refrescar panel
// ==========================================================

async function refreshDashboard() {

    console.log("ANTES DE LOAD");

    try {

        const devices = await loadDevices();

        console.log("DEVICES:", devices);

        updateCounters(devices);

        renderDevices(devices);

        // ### FIX
        updateLastRefresh();

    }
    catch (error) {

        console.error("ERROR EN LOAD");

        console.error(error);

    }

    console.log("FIN");

}

// ==========================================================
// Inicialización
// ==========================================================

refreshDashboard();

// ### FIX
setInterval(
    refreshDashboard,
    20000
);

window.addEventListener(
    "devicesChanged",
    () => {

        refreshDashboard();

    }
);

const registerButton =
    document.getElementById("registerDeviceButton");

if (registerButton) {

    registerButton.addEventListener("click", () => {

        openDeviceRegisterDialog();

    });

}

// ==========================================================
// ### FIX
// Botón de refresco manual
// ==========================================================

const refreshButton =
    document.getElementById(
        "refreshDashboardButton"
    );

if (refreshButton) {

    refreshButton.addEventListener(
        "click",
        () => {

            refreshDashboard();

        }
    );

}
