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

    if (isPi(device)) {
        return `
            <div class="srt-summary emitter" title="LigronPi es un emisor: no publica cajas receptoras.">
                <span class="srt-chip emitter">EMISOR</span>
                <span class="srt-total">sin cajas</span>
            </div>`;
    }

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

    if (offline > 0) {
        return `
            <div
                class="srt-summary unavailable"
                title="Native sin presencia reciente: sus ${offline} cajas no están disponibles ni tienen reservas operativas.">
                <span class="srt-chip offline">
                    Native apagado · ${offline} cajas
                </span>
            </div>`;
    }

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

    if (!deviceIsLive(device)) {
        return `
            <span class="runtime-pill offline">OFFLINE</span>
            <span class="runtime-line stale">
                Última sesión: ${escapeHtml(state)}
            </span>
            ${source ? `
                <span class="runtime-line stale">
                    Última fuente: ${escapeHtml(source)}
                </span>` : ""}
            ${target ? `
                <span class="runtime-line target stale">
                    Último destino: ${escapeHtml(target)}
                </span>` : ""}
        `;
    }

    return `

        <span class="runtime-pill ${escapeHtml(state.toLowerCase())}">

            ${escapeHtml(state)}

        </span>

        ${source ? `
            <span class="runtime-line">
                ${escapeHtml(source)}
            </span>` : ""}

        ${
            target
                ? `
                    <span class="runtime-line target">
                        ${isPi(device) ? "Conectado a: " : "Destino: "}${escapeHtml(target)}
                    </span>
                `
                : ""
        }

    `;

}

function formatTelemetryNumber(value, suffix = "") {
    const number = Number(value);
    return Number.isFinite(number) ? `${number.toLocaleString("es-ES", { maximumFractionDigits: 1 })}${suffix}` : "—";
}

function renderPiTelemetry(device) {
    if (!isPi(device)) return "";
    const runtime = device.runtime_status || {};
    const telemetry = runtime.telemetry && typeof runtime.telemetry === "object" ? runtime.telemetry : {};
    const system = telemetry.system || {};
    const network = telemetry.network || {};
    const audio = telemetry.audio || {};
    const pipeline = telemetry.pipeline || {};
    const packetLoss = pipeline.packet_loss && typeof pipeline.packet_loss === "object"
        ? pipeline.packet_loss
        : {};
    if (!telemetry.sampled_at) {
        return `<div class="pi-telemetry muted">Telemetría Pi pendiente del siguiente heartbeat.</div>`;
    }
    return `
        <div class="pi-telemetry">
            <strong>Telemetría de LigronPi</strong>
            <span>CPU: ${escapeHtml(formatTelemetryNumber(system.cpu_percent, "%"))}</span>
            <span>RAM: ${escapeHtml(formatTelemetryNumber(system.ram_percent, "%"))}</span>
            <span>Temperatura: ${escapeHtml(formatTelemetryNumber(system.temperature_c, " °C"))}</span>
            <span>Red: ↓ ${escapeHtml(formatTelemetryNumber(network.download_kbps, " kb/s"))} · ↑ ${escapeHtml(formatTelemetryNumber(network.upload_kbps, " kb/s"))}</span>
            <span>Vúmetro: L ${escapeHtml(formatTelemetryNumber(audio.left_percent, "%"))} · R ${escapeHtml(formatTelemetryNumber(audio.right_percent, "%"))}</span>
            <span>Preview: ${escapeHtml(formatTelemetryNumber(pipeline.preview_fps, " fps"))} · ${escapeHtml(String(pipeline.preview_frames ?? "—"))} frames</span>
            <span>SRT: ${escapeHtml(String(pipeline.srt_phase || "IDLE"))}${pipeline.retry_count ? ` · reintentos ${escapeHtml(String(pipeline.retry_count))}` : ""}</span>
            <span class="${packetLoss.active ? "telemetry-warning" : ""}">Paquetes: ${packetLoss.active ? "DEGRADACIÓN ACTIVA" : "sin incidencias actuales"}${packetLoss.events ? ` · avisos ${escapeHtml(String(packetLoss.events))}` : ""}</span>
            <span class="telemetry-time">Muestra: ${escapeHtml(telemetry.sampled_at)}</span>
        </div>`;
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

function deviceIsLive(device) {
    return String(device.control_state || device.estado || "OFFLINE")
        .trim()
        .toUpperCase() === "ONLINE";
}

function piProfile(device) {
    const network = device.network_status || {};
    const model = String(network.hardware_model || "").trim();
    const memoryGb = Number(network.hardware_memory_gb || 0);
    const family = /raspberry\s+pi\s+5/i.test(model)
        ? "Raspberry Pi 5"
        : /raspberry\s+pi\s+4/i.test(model)
            ? "Raspberry Pi 4"
            : model || "Raspberry Pi";
    const memory = memoryGb > 0 ? `${memoryGb} GB RAM` : "RAM sin informar";
    return {
        family,
        memory,
        summary: `${family} · ${memory} · emisor SRT · referencia 25 fps`
    };
}

function renderPiProfile(device) {
    if (!isPi(device)) return "";
    const profile = piProfile(device);
    return `<span class="device-profile" title="${escapeHtml(profile.summary)}">${escapeHtml(profile.summary)}</span>`;
}

let routePlansByPair = new Map();

function ligronTailState(device) {
    const network = device.network_status || {};
    if (network.tailscale_available && network.tailscale_ipv4_address && network.tailscale_tailnet) {
        const evidence = String(network.tailscale_evidence || "").toUpperCase();
        return {
            label: "ACTIVO",
            tone: "ready",
            detail: `${network.tailscale_ipv4_address} · ${network.tailscale_tailnet}${evidence === "ADAPTER_AND_POLICY" ? " · adaptador/política" : ""}`
        };
    }
    const provisioning = String(network.tailscale_provisioning_state || "").toUpperCase();
    const provisioningError = String(network.tailscale_provisioning_error || "").trim();
    const provisioningState = {
        REQUESTING: { label: "VINCULANDO", detail: "solicitando identidad de red" },
        ELEVATION_REQUESTED: { label: "VINCULANDO", detail: "instalando red privada" },
        ELEVATION_REJECTED: { label: "PERMISO REQUERIDO", detail: "Windows rechazó la instalación de red" },
        INSTALL_PENDING: { label: "INSTALACIÓN EN CURSO", detail: "Windows todavía no ha confirmado Tailscale" },
        INSTALL_FAILED: { label: "INSTALACIÓN FALLIDA", detail: "Native no pudo activar Tailscale; consulta el registro de LigronTail" },
        STATUS_HANDOFF_FAILED: { label: "RESULTADO DESCONOCIDO", detail: "Native no pudo recuperar el resultado de la instalación" },
        INVALID_BOOTSTRAP: { label: "IDENTIDAD DE RED INVÁLIDA", detail: "Link no entregó una credencial temporal válida" },
        LIGRONTAIL_NOT_CONFIGURED: { label: "RED NO CONFIGURADA", detail: "Link aún no tiene su identidad de red" },
        ACCOUNT_VALIDATION_FAILED: { label: "REVALIDACIÓN REQUERIDA", detail: "vuelve a iniciar sesión en Native" },
        DEVICE_OWNERSHIP_FAILED: { label: "EQUIPO NO VINCULADO", detail: "este Native no pertenece a la cuenta activa" },
        BOOTSTRAP_INPUT_MISSING: { label: "SESIÓN INCOMPLETA", detail: "Native debe iniciar sesión de nuevo" },
        LIGRONTAIL_NETWORK_FAILED: { label: "LINK INALCANZABLE", detail: "Native no pudo llegar a Link" },
        LIGRONTAIL_PROVIDER_FAILED: { label: "RED PRIVADA NO DISPONIBLE", detail: "Link no pudo obtener la identidad de red" },
        REQUEST_FAILED: { label: "VINCULACIÓN FALLIDA", detail: "Link no pudo preparar la red privada" },
        INSTALLER_MISSING: { label: "INSTALADOR AUSENTE", detail: "Native necesita su componente LigronTail" }
    };
    if (provisioningState[provisioning]) {
        return {
            ...provisioningState[provisioning],
            detail: provisioning === "INSTALL_FAILED" && provisioningError
                ? provisioningError
                : provisioningState[provisioning].detail,
            tone: "not-ready"
        };
    }
    const state = String(network.tailscale_state || "NO_REPORT").toUpperCase();
    const labels = {
        NOT_INSTALLED: "NO INSTALADO",
        NEEDSLOGIN: "RED PRIVADA PENDIENTE",
        NEEDS_LOGIN: "RED PRIVADA PENDIENTE",
        ACCESS_DENIED: "PENDIENTE DE PROVISIÓN",
        TAILNET_UNKNOWN: "TAILNET SIN IDENTIFICAR",
        STOPPED: "SERVICIO DETENIDO",
        UNRESPONSIVE: "SIN RESPUESTA",
        NO_ADDRESS: "SIN DIRECCIÓN",
        NO_REPORT: "SIN INFORME"
    };
    const detail = {
        ACCESS_DENIED: "servicio Windows protegido; falta provisión",
        TAILNET_UNKNOWN: network.tailscale_ipv4_address
            ? `${network.tailscale_ipv4_address} · falta identificar tailnet`
            : "adaptador sin tailnet identificable",
        NEEDSLOGIN: "autorización inicial pendiente",
        NEEDS_LOGIN: "autorización inicial pendiente",
        NOT_INSTALLED: "cliente no instalado",
        STOPPED: "servicio detenido",
        UNRESPONSIVE: "servicio sin respuesta",
        NO_ADDRESS: "sin dirección de overlay",
        NO_REPORT: "aún sin heartbeat de Native"
    };
    return { label: labels[state] || state, tone: "not-ready", detail: detail[state] || "LigronTail" };
}

function routePlan(pi, native) {
    return routePlansByPair.get(`${pi.uuid}:${native.uuid}`) || {
        selected_label: "Pendiente de informe",
        selected_reason: "Link aún no ha publicado el plan de esta pareja de equipos.",
        candidates: []
    };
}

function renderLigronTailDeviceLine(device) {
    const tail = ligronTailState(device);
    if (!deviceIsLive(device)) {
        return `
            <span class="device-ligron-tail stale" title="Sin presencia reciente en LigronLink. ${escapeHtml(tail.detail)}">
                LigronTail: sin presencia
            </span>`;
    }
    return `
        <span class="device-ligron-tail ${tail.tone}" title="${escapeHtml(tail.detail)}">
            LigronTail: ${escapeHtml(tail.label)}
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
    const deviceLive = deviceIsLive(device);
    const networkHeading = deviceLive
        ? "Red sincronizada con LigronLink"
        : "Última red registrada · sin presencia actual";
    const tailLine = deviceLive
        ? `<span title="${escapeHtml(tail.detail)}">LigronTail: ${escapeHtml(tail.label)} · ${escapeHtml(network.tailscale_ipv4_address || "—")}</span>`
        : `<span title="${escapeHtml(tail.detail)}">LigronTail: sin presencia</span>`;
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
            const selected = route.selected_transport ? "ready" : "not-ready";
            const candidates = Array.isArray(route.candidates) && route.candidates.length
                ? route.candidates.map(candidate => `<li class="route-candidate ${candidate.state === "READY" ? "ready" : "not-ready"}">
                    <strong>${escapeHtml(candidate.label)}</strong>: ${escapeHtml(candidate.reason)}
                </li>`).join("")
                : "<li class=\"route-candidate not-ready\">Aún no hay capacidades de red publicadas.</li>";
            return `<div class="device-route ${selected}">
                <span>${escapeHtml(peer.alias || getDeviceTypeName(peer.tipo))}: <strong>${escapeHtml(route.selected_label)}</strong> · ${escapeHtml(route.selected_reason)}</span>
                <details class="route-explanation">
                    <summary>Ver rutas y criterios</summary>
                    <ul>${candidates}</ul>
                </details>
            </div>`;
        }).join("")
        : '<span class="device-route not-ready">No hay equipo complementario registrado en esta cuenta.</span>';
    const networkDetails = `
        <div class="receiver-network">
            <strong>${networkHeading}</strong>
            <span>Sincronización: ${escapeHtml(network.sync_state || "NO REPORTADA")}</span>
            <span>IP local: ${escapeHtml(network.ipv4_address || "—")}</span>
            <span>IP exterior: ${escapeHtml(device.public_ip || "—")}</span>
            <span>IPv6: ${escapeHtml(network.ipv6_address || "—")}</span>
            ${tailLine}
            <span>Última presencia: ${escapeHtml(network.last_seen_at || "—")}</span>
            ${renderPiTelemetry(device)}
            <div class="device-route-list">
                <strong>Gestor de rutas con equipos vinculados</strong>
                <span class="route-guidance">LigronLink selecciona automáticamente la primera ruta comprobada. Esta vista informa: no abre puertos, no modifica la VPN y no inicia emisiones.</span>
                ${routes}
            </div>
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
                const reportedState =
                    String(receiver.reported_state || "").toUpperCase();

                const label =
                    state === "FREE"
                        ? "Esperando"
                        : state === "BUSY"
                            ? "En uso"
                            : state === "RESERVED"
                                ? "Reservado"
                                : "Apagado";
                const reservedBy = String(receiver.reserved_by_alias || "").trim();
                const inactiveReservedBy = String(
                    receiver.inactive_reservation_by_alias || ""
                ).trim();
                const ownerLine = reservedBy && (state === "RESERVED" || state === "BUSY")
                    ? `<div class="receiver-owner">Por: ${escapeHtml(reservedBy)}</div>`
                    : inactiveReservedBy && (reportedState === "RESERVED" || reportedState === "BUSY")
                        ? `<div class="receiver-owner history">Última asociación: ${escapeHtml(inactiveReservedBy)} · no activa</div>`
                        : "";

                return `

                    <div class="receiver-card ${escapeHtml(state.toLowerCase())}${ownerLine ? " has-owner" : ""}">

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

                        ${ownerLine}

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
// Renderizar listado de equipos
// ==========================================================

const expandedDeviceUuids = new Set();

function renderDevices(devices) {

    const deviceList =
        document.getElementById("deviceList");

    if (!deviceList) {

        return;

    }

    deviceList.innerHTML = "";
    const currentUuids = new Set(devices.map(device => String(device.uuid || "")));
    for (const uuid of expandedDeviceUuids) {
        if (!currentUuids.has(uuid)) expandedDeviceUuids.delete(uuid);
    }

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

        const deviceUuid = String(device.uuid || "");
        const expanded = expandedDeviceUuids.has(deviceUuid);

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

                    ${escapeHtml(friendlyType)}${isPi(device) ? " · EMISOR" : ""}

                </span>

                <span class="device-main-alias">

                    ${escapeHtml(device.alias || "Sin alias")}

                </span>

                ${renderPiProfile(device)}

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
                        class="ligron-button receivers-button"
                        title="Muestra el plan de rutas y el estado de las cajas; no modifica la red."
                        aria-expanded="${expanded}">

                        ${expanded ? (isNative(device) ? "Ocultar red y cajas" : "Ocultar red") : (isNative(device) ? "Red y cajas" : "Red")}

                    </button>

                    <button
                        type="button"
                        class="ligron-button delete-button"
                        title="Elimina este equipo de LigronLink después de pedir confirmación.">

                        Eliminar

                    </button>

                </div>

            </td>

        `;

        const deleteButton =
            row.querySelector(".delete-button");

        const receiversButton =
            row.querySelector(".receivers-button"); // ### FIX

        deleteButton.addEventListener("click", () => {

            removeDevice(device);

        });

        deviceList.appendChild(row);

        detailRow.className = `receiver-detail-row${expanded ? "" : " hidden"}`;
        detailRow.innerHTML = `

            <td colspan="7" class="receiver-detail-cell">

                ${renderReceiverDetails(device, devices)}

            </td>

        `;

        receiversButton.addEventListener("click", () => {

            detailRow.classList.toggle("hidden");
            const expanded = !detailRow.classList.contains("hidden");
            if (expanded) expandedDeviceUuids.add(deviceUuid);
            else expandedDeviceUuids.delete(deviceUuid);
            receiversButton.setAttribute("aria-expanded", String(expanded));
            receiversButton.textContent = expanded
                ? (isNative(device) ? "Ocultar red y cajas" : "Ocultar red")
                : (isNative(device) ? "Red y cajas" : "Red");

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

        const { devices, routePlans } = await loadDevices();

        routePlansByPair = new Map(routePlans.map((plan) => [
            `${plan.pi_uuid}:${plan.native_uuid}`,
            plan
        ]));

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
