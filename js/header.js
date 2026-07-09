// ==========================================================
// LigronAir
// header.js
// Gestión dinámica del encabezado
// ==========================================================

import { getUser, logout } from "./session.js";

const header = document.getElementById("headerActions");

if (header) {

    const user = getUser();

    if (user) {

        header.innerHTML = `
            <span class="header-user">
                <img
                    src="assets/iconos/usuario.svg"
                    class="icon icon24"
                    alt=""
                    aria-hidden="true" />
                <span class="header-user-name">${user.nombre}</span>
            </span>

            <button
                id="logoutButton"
                type="button"
                class="ligron-button secondary">

                Cerrar sesión
            </button>
        `;

        document
            .getElementById("logoutButton")
            .addEventListener("click", logout);

    }
    else {

        header.innerHTML = `
            <a
                href="login.html"
                class="ligron-button primary button-with-icon">

                <img
                    src="assets/iconos/usuario.svg"
                    class="icon icon40"
                    alt=""
                    aria-hidden="true" />

                <span>
                    Iniciar sesión
                </span>
            </a>

            <a
                href="register.html"
                class="ligron-button secondary button-with-icon">

                <img
                    src="assets/iconos/añadir.svg"
                    class="icon icon40"
                    alt=""
                    aria-hidden="true" />

                <span>
                    Crear cuenta
                </span>
            </a>
        `;

    }

}
