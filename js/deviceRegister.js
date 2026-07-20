// ==========================================================
// LigronLink
// Device Register
// ==========================================================

export function openDeviceRegisterDialog() {

    dialog.open({

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

                    dialog.close();

                }

            },

            {

                text: "Registrar",

                class: "primary",

                action: () => {

                    const tipo =
                        document.getElementById("deviceType").value;

                    const alias =
                        document.getElementById("deviceAlias").value.trim();

                    const uuid =
                        document.getElementById("deviceUuid").value.trim();

                    console.log({

                        tipo,
                        alias,
                        uuid

                    });

                    dialog.close();

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