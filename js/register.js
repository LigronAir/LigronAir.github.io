const form = document.getElementById("registerForm");

form.addEventListener("submit", async function (event) {

    event.preventDefault();

    const nombre = document.getElementById("nombre").value.trim();

    const email = document.getElementById("email").value.trim();

    const password = document.getElementById("password").value;

    const password2 = document.getElementById("password2").value;

    if (password !== password2) {

        alert("Las contraseñas no coinciden.");

        return;

    }

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

    alert(JSON.stringify(resultado, null, 2));

});