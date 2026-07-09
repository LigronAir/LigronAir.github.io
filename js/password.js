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

        const group = input.parentElement;

        if (!group) {
            return;
        }

        group.style.position = "relative";

        const button = document.createElement("button");

        button.type = "button";

        button.className = "password-toggle";

        button.title = "Mostrar contraseña";

        button.setAttribute("aria-label", "Mostrar contraseña");

        button.innerHTML = `
            <img
                src="assets/iconos/mostrar.svg"
                class="icon icon40"
                alt=""
                aria-hidden="true" />
        `;

        group.appendChild(button);

        button.addEventListener("click", function () {

            if (input.type === "password") {

                input.type = "text";

                button.title = "Ocultar contraseña";

                button.setAttribute("aria-label", "Ocultar contraseña");

                button.innerHTML = `
                    <img
                        src="assets/iconos/ocultar.svg"
                        class="icon icon40"
                        alt=""
                        aria-hidden="true" />
                `;

            }
            else {

                input.type = "password";

                button.title = "Mostrar contraseña";

                button.setAttribute("aria-label", "Mostrar contraseña");

                button.innerHTML = `
                    <img
                        src="assets/iconos/mostrar.svg"
                        class="icon icon40"
                        alt=""
                        aria-hidden="true" />
                `;

            }

        });

    });

});
