// ==========================================================
// LigronAir
// js/login.js
// Inicio de sesión
// ==========================================================

import { saveUser } from "./session.js";

const form = document.getElementById("loginForm");

const message = document.getElementById("loginMessage");

function showMessage(text, type) {

    message.classList.remove("hidden", "success", "error");

    message.classList.add(type);

    message.innerHTML = text;

}

form.addEventListener("submit", async function (event) {

    event.preventDefault();

    message.classList.add("hidden");

    const email = document.getElementById("email").value.trim();

    const password = document.getElementById("password").value;

    try {

        const response = await fetch(

            "https://ligronlink.ligronlink-dev.workers.dev/api/v1/login",

            {

                method: "POST",

                headers: {

                    "Content-Type": "application/json"

                },

                body: JSON.stringify({

                    email,

                    password

                })

            }

        );

        const resultado = await response.json();

        if (resultado.success) {

            // Guardar la sesión del usuario
            saveUser(resultado.user);

            showMessage(

                "✅ Bienvenido <strong>" +
                resultado.user.nombre +
                "</strong>.",

                "success"

            );

            form.reset();

            // Redirigir al espacio privado
            setTimeout(function () {

                window.location.href = "home.html";

            }, 1000);

        }
        else {

            showMessage(

                resultado.error,

                "error"

            );

        }

    }
    catch (error) {

        showMessage(

            "No se ha podido contactar con LigronLink.",

            "error"

        );

    }

});