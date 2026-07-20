// ==========================================================
// LigronLink
// Home
// ==========================================================

import { getUser } from "./session.js";

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

        dialog.open({

            title: "Registrar equipo",

            content: `

                <p>

                    Bienvenido al sistema de registro de equipos
                    de LigronLink.

                </p>

                <p>

                    En el siguiente paso aparecerá aquí el formulario.

                </p>

            `,

            buttons: [

                {

                    text: "Cerrar",

                    class: "secondary",

                    action: () => {

                        dialog.close();

                    }

                },

                {

                    text: "Continuar",

                    class: "primary",

                    action: () => {

                        alert("Siguiente paso: formulario.");

                    }

                }

            ]

        });

    });

}