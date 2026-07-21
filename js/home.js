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