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

                👤 ${user.nombre}

            </span>

            <button
                id="logoutButton"
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
                class="ligron-button primary">

                Iniciar sesión

            </a>

            <a
                href="register.html"
                class="ligron-button secondary">

                Crear cuenta

            </a>

        `;

    }

}