// ==========================================================
// LigronLink
// Home
// ==========================================================

import { getUser } from "./session.js";
import { openDeviceRegisterDialog } from "./deviceRegister.js";
import { loadDevices } from "./devices.js";

// ==========================================================
// Comprobar sesión
// ==========================================================

const user = getUser();

if (!user) {

    window.location.href = "login.html";

}
else {

    console.log("Bienvenido", user.nombre);

}

// ==========================================================
// Inicializar
// ==========================================================

init();

async function init() {

    try {

        const devices = await loadDevices();

        console.log("Equipos:", devices);

    }
    catch (error) {

    console.error("ERROR");

    console.error(error);

}

}

// ==========================================================
// Registrar equipo
// ==========================================================

const registerButton = document.getElementById(
    "registerDeviceButton"
);

if (registerButton) {

    registerButton.addEventListener("click", () => {

        openDeviceRegisterDialog();

    });

}