// ==========================================================
// LigronLink
// Gestión de equipos
// ==========================================================

import { getAccessToken, getUser } from "./session.js";

const API =
    "https://api.ligronair.tv/api/v1";

// ==========================================================
// Obtener usuario autenticado
// ==========================================================

function getCurrentUser() {

    const user = getUser();

    if (!user) {

        throw new Error(
            "No existe una sesión iniciada."
        );

    }

    return user;

}

// ==========================================================
// Obtener equipos
// ==========================================================

export async function loadDevices() {

    console.log("=== LOAD DEVICES ===");

    getCurrentUser();
    const token = getAccessToken();

    const response =
        await fetch(

            API + "/devices",
            {
                headers: { "Authorization": `Bearer ${token}` }
            }

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

    return {
        devices: Array.isArray(result.devices) ? result.devices : [],
        routePlans: Array.isArray(result.route_plans) ? result.route_plans : []
    };

}

// ==========================================================
// ### FIX
// Eliminar equipo
// ==========================================================

export async function deleteDevice(deviceId) {

    console.log("=== DELETE DEVICE ===");

    getCurrentUser();
    const token = getAccessToken();

    const response =
        await fetch(

            API +
            "/device/" +
            deviceId,

            {

                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }

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
