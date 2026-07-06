const form = document.getElementById("registerForm");

const message = document.getElementById("registerMessage");

function showMessage(text, type) {

    message.classList.remove("hidden", "success", "error");

    message.classList.add(type);

    message.innerHTML = text;

}

form.addEventListener("submit", async function (event) {

    event.preventDefault();

    message.classList.add("hidden");

    const nombre = document.getElementById("nombre").value.trim();

    const email = document.getElementById("email").value.trim();

    const password = document.getElementById("password").value;

    const password2 = document.getElementById("password2").value;

    if (password !== password2) {

        showMessage(

            "Las contraseñas no coinciden.",

            "error"

        );

        return;

    }

    try {

        const response = await fetch(

            "https://ligronlink.ligronlink-dev.workers.dev/api/v1/register",

            {

                method: "POST",

                headers: {

                    "Content-Type": "application/json"

                },

                body: JSON.stringify({

                    nombre,

                    email,

                    password

                })

            }

        );

        const resultado = await response.json();

        if (resultado.success) {

            showMessage(

                "✅ Cuenta creada correctamente.<br><br>Serás redirigido al inicio de sesión...",

                "success"

            );

            form.reset();

            setTimeout(function () {

                window.location.href = "login.html";

            }, 2500);

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