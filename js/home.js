// ==========================================================
// LigronLink
// Home
// ==========================================================

import { getUser } from "./session.js";
import { openDeviceRegisterDialog } from "./deviceRegister.js";
import { loadDevices } from "./devices.js";

console.log("HOME CARGADO");

const user = getUser();

if (!user) {

    window.location.href = "login.html";

}
else {

    console.log("Bienvenido", user.nombre);

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