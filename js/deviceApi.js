// ==========================================================
// LigronLink
// Gestión de equipos
// ==========================================================

const API =
    "https://api.ligronair.tv/api/v1";

// ==========================================================
// Obtener usuario autenticado
// ==========================================================

function getCurrentUser() {

    const raw =
        localStorage.getItem("ligronUser");

    if (!raw) {

        throw new Error(
            "No existe una sesión iniciada."
        );

    }

    return JSON.parse(raw);

}

// ==========================================================
// Obtener equipos
// ==========================================================

export async function loadDevices() {

    console.log("=== LOAD DEVICES ===");

    const user =
        getCurrentUser();

    const response =
        await fetch(

            API +
            "/devices?email=" +
            encodeURIComponent(user.email)

        );

    console.log("HTTP:", response.status);

    const result =
        await response.json();

    console.log("RESULTADO:", result);

    if (!response.ok || !result.success) {

        throw new Error(

            result.error ||
            "No se pudieron cargar los equipos."

        );

    }

    return result.devices;

}

// ==========================================================
// ### FIX
// Eliminar equipo
// ==========================================================

export async function deleteDevice(deviceId) {

    console.log("=== DELETE DEVICE ===");

    const user =
        getCurrentUser();

    const response =
        await fetch(

            API +
            "/device/" +
            deviceId +
            "?email=" +
            encodeURIComponent(user.email),

            {

                method: "DELETE"

            }

        );

    console.log("HTTP:", response.status);

    const result =
        await response.json();

    console.log("RESULTADO:", result);

    if (!response.ok || !result.success) {

        throw new Error(

            result.error ||
            "No se pudo eliminar el equipo."

        );

    }

    return true;

}