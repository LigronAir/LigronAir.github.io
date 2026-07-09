// ==========================================================
// LigronLink
// Home
// ==========================================================

import { getUser } from "./session.js";

const user = getUser();

if (!user) {

    window.location.href = "login.html";

}
else {

    console.log("Bienvenido", user.nombre);

}