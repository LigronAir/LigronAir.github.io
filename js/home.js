// ==========================================================
// LigronLink
// Home
// ==========================================================

import { getUser } from "./session.js";
import { openDeviceRegisterDialog } from "./deviceRegister.js";
import {
    loadDevices,
    deleteDevice
} from "./devices.js";

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
                    colspan="6"
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

        const status =
            String(device.estado || "OFFLINE")
                .toUpperCase();

        const friendlyType =
            getDeviceTypeName(device.tipo);

        row.className = "devices-row";

        row.innerHTML = `

            <td class="devices-cell status ${status.toLowerCase()}">

                <span class="status-dot"></span>

                <span class="status-label">

                    ${status}

                </span>

            </td>

            <td class="devices-cell name">

                <strong class="device-main-name">

                    ${friendlyType}

                </strong>

                <span class="device-main-alias">

                    ${device.alias || "Sin alias"}

                </span>

            </td>

            <td class="devices-cell type">

                ${friendlyType}

            </td>

            <td class="devices-cell uuid"
                title="${device.uuid || "—"}">

                ${device.uuid || "—"}

            </td>

            <td class="devices-cell registered">

                ${formatDate(device.fecha_creacion)}

            </td>

            <td class="devices-cell actions">

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

            </td>

        `;

        const editButton =
            row.querySelector(".edit-button");

        const deleteButton =
            row.querySelector(".delete-button");

        editButton.addEventListener("click", () => {

            editDevice(device);

        });

        deleteButton.addEventListener("click", () => {

            removeDevice(device);

        });

        deviceList.appendChild(row);

    });

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