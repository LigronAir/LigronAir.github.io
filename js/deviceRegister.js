// ==========================================================
// LigronLink
// Device Register
// ==========================================================
console.log("DEVICE REGISTER V2");

export function openDeviceRegisterDialog() {

    window.dialog.open({

        title: "Registrar equipo",

        content: `

            <div class="device-register-form">

                <div class="form-group">

                    <label for="deviceType">

                        Tipo

                    </label>

                    <select id="deviceType">

                        <option value="ligronair">

                            LigronAir Native (Escritorio)

                        </option>

                        <option value="ligronpi">

                            LigronPi

                        </option>

                        <option value="other">

                            Otro...

                        </option>

                    </select>

                </div>

                <div class="form-group">

                    <label for="deviceAlias">

                        Alias

                    </label>

                    <input
                        id="deviceAlias"
                        type="text"
                        placeholder="Ej. Realización Principal" />

                </div>

                <div
                    class="form-group"
                    id="uuidGroup">

                    <label for="deviceUuid">

                        UUID

                    </label>

                    <input
                        id="deviceUuid"
                        type="text"
                        placeholder="UUID del equipo" />

                </div>

            </div>

        `,

        buttons: [

            {

                text: "Cancelar",

                class: "secondary",

                action: () => {

                    window.dialog.close();

                }

            },

            {

                text: "Registrar",

                class: "primary",

                action: async () => {

                    const tipo =
                        document.getElementById("deviceType").value;

                    const alias =
                        document.getElementById("deviceAlias").value.trim();

                    const uuid =
                        document.getElementById("deviceUuid").value.trim();

                    try {

                        const response = await fetch(

                            "https://ligronlink.ligronlink-dev.workers.dev/api/v1/device/register",

                            {

                                method: "POST",

                                headers: {

                                    "Content-Type": "application/json"

                                },

                                body: JSON.stringify({

                                    tipo,
                                    alias,
                                    uuid

                                })

                            }

                        );

                        const result = await response.json();

                        if (!response.ok || !result.success) {

                            alert(result.error || "No se pudo registrar el equipo.");

                            return;

                        }

                        alert("Equipo registrado correctamente.");

                        window.dialog.close();

                    }
                    catch (error) {

                        console.error(error);

                        alert("No se pudo conectar con LigronLink.");

                    }

                }

            }

        ]

    });

    // ======================================================
    // Mostrar / ocultar UUID
    // ======================================================

    const type =
        document.getElementById("deviceType");

    const uuidGroup =
        document.getElementById("uuidGroup");

    type.addEventListener("change", () => {

        if (type.value === "other") {

            uuidGroup.style.display = "none";

        }
        else {

            uuidGroup.style.display = "";

        }

    });

}