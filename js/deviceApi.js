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

// El dueño concede una ventana corta de recuperación. El navegador nunca
// recibe ni muestra una credencial: la Pi ya conserva su identidad local y
// recoge por HTTPS el resultado cuando el propietario la autoriza.
export async function authorizePiRecovery(deviceUuid) {
    getCurrentUser();
    const response = await fetch(API + "/device/authorization", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${getAccessToken()}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ device_uuid: deviceUuid }),
        cache: "no-store"
    });
    const result = await response.json();
    if (!response.ok || !result.success) {
        throw new Error(result.error || "No se pudo autorizar la recuperación de la Pi.");
    }
    return result;
}

export async function loadPendingPiPairings() {
    getCurrentUser();
    const response = await fetch(API + "/device/pairings", {
        headers: { "Authorization": `Bearer ${getAccessToken()}` },
        cache: "no-store"
    });
    const result = await response.json();
    if (!response.ok || !result.success) {
        throw new Error(result.error || "No se pudieron consultar las vinculaciones pendientes.");
    }
    return Array.isArray(result.pairings) ? result.pairings : [];
}

export async function approvePiPairing(pairingId) {
    getCurrentUser();
    const response = await fetch(
        API + "/device/pairing/" + encodeURIComponent(pairingId) + "/approve",
        {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${getAccessToken()}`,
                "Content-Type": "application/json"
            },
            body: "{}",
            cache: "no-store"
        }
    );
    const result = await response.json();
    if (!response.ok || !result.success) {
        throw new Error(result.error || "No se pudo aprobar la vinculación de la Pi.");
    }
    return result;
}

export async function revokeDeviceCredential(deviceUuid) {
    getCurrentUser();
    const response = await fetch(API + "/device/credential", {
        method: "DELETE",
        headers: {
            "Authorization": `Bearer ${getAccessToken()}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ device_uuid: deviceUuid }),
        cache: "no-store"
    });
    const result = await response.json();
    if (!response.ok || !result.success) {
        throw new Error(result.error || "No se pudo revocar la credencial de la Pi.");
    }
    return result;
}
