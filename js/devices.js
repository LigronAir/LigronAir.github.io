// ==========================================================
// LigronLink
// Gestión de equipos
// ==========================================================

const API =
    "https://ligronlink.ligronlink-dev.workers.dev/api/v1";

// ==========================================================
// Obtener equipos
// ==========================================================

export async function loadDevices() {

    console.log("=== LOAD DEVICES ===");

    const response = await fetch(

        API + "/devices"

    );

    console.log("HTTP:", response.status);

    const result = await response.json();

    console.log("RESULTADO:", result);

    if (!response.ok || !result.success) {

        throw new Error(

            result.error || "No se pudieron cargar los equipos."

        );

    }

    return result.devices;

}