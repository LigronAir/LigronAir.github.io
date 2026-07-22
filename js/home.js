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

    // ### FIX: obtener referencias a los contadores
    const totalDevices =
        document.getElementById("totalDevices");

    const onlineDevices =
        document.getElementById("onlineDevices");

    const offlineDevices =
        document.getElementById("offlineDevices");

    // ### FIX: calcular estadísticas
    const total =
        devices.length;

    const online =
        devices.filter(device =>
            String(device.estado || "")
                .toUpperCase() === "ONLINE"
        ).length;

    const offline =
        total - online;

    // ### FIX: actualizar la interfaz
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

        `;

        return;

    }

    devices.forEach(device => {

        const row =
            document.createElement("div");

        const status =
            String(device.estado || "OFFLINE")
                .toUpperCase();

        row.className = "devices-row";

        row.innerHTML = `

            <div class="devices-cell status ${status.toLowerCase()}">

                ${status}

            </div>

            <div class="devices-cell">

                <strong>${device.alias || "Sin alias"}</strong>

            </div>

            <div class="devices-cell">

                ${getDeviceTypeName(device.tipo)}

            </div>

            <div class="devices-cell">

                ${device.uuid || "—"}

            </div>

            <div class="devices-cell">

                ${formatDate(device.fecha_creacion)}

            </div>

            <div class="devices-cell actions">

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