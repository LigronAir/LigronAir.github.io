// ==========================================================
// LigronLink
// Home
// ==========================================================

import { getUser } from "./session.js";
import { openDeviceRegisterDialog } from "./deviceRegister.js";

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