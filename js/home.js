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

        location.reload();

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

function renderDevices(devices) {

    const deviceList =
        document.getElementById("deviceList");

    if (!deviceList) {

        return;

    }

    // Si no hay equipos dejamos el HTML original
    if (devices.length === 0) {

        return;

    }

    // Sustituimos el estado vacío por el listado
    deviceList.innerHTML = "";

    devices.forEach(device => {

        const card =
            document.createElement("div");

        card.className = "device-card";

        card.innerHTML = `

            <div class="device-header">

                <strong>${getDeviceTypeName(device.tipo)}</strong>

            </div>

            <div class="device-alias">

                Alias.............. ${device.alias}

            </div>

            <div class="device-actions">

                <button
                    class="ligron-button">

                    Editar

                </button>

                <button
                    class="ligron-button delete-button">

                    Eliminar

                </button>

            </div>

        `;

        const deleteButton =
            card.querySelector(".delete-button");

        deleteButton.addEventListener("click", () => {

            removeDevice(device);

        });

        deviceList.appendChild(card);

    });

}

(async () => {

    console.log("ANTES DE LOAD");

    try {

        const devices = await loadDevices();

        console.log("DEVICES:", devices);

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
                device.estado === "ONLINE"
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

        // ==================================================
        // ### FIX
        // Mostrar listado de equipos
        // ==================================================

        renderDevices(devices);

    }
    catch (error) {

        console.error("ERROR EN LOAD");

        console.error(error);

    }

    console.log("FIN");

})();

const registerButton =
    document.getElementById("registerDeviceButton");

if (registerButton) {

    registerButton.addEventListener("click", () => {

        openDeviceRegisterDialog();

    });

}