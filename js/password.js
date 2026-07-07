// ==========================================================
// LigronAir
// password.js
// Mostrar / Ocultar contraseña
// ==========================================================

document.addEventListener("DOMContentLoaded", function () {

    const passwordFields = document.querySelectorAll(
        "input[type='password']"
    );

    passwordFields.forEach(function (input) {

        const button = document.createElement("button");

        button.type = "button";

        button.className = "password-toggle";

        button.title = "Mostrar contraseña";

        button.innerHTML = "👁";

        input.parentElement.style.position = "relative";

        input.parentElement.appendChild(button);

        button.addEventListener("click", function () {

            if (input.type === "password") {

                input.type = "text";

                button.innerHTML = "🙈";

                button.title = "Ocultar contraseña";

            }
            else {

                input.type = "password";

                button.innerHTML = "👁";

                button.title = "Mostrar contraseña";

            }

        });

    });

});