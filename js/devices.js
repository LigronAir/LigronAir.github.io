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

    const response = await fetch(

        API + "/devices"

    );

    const result = await response.json();

    if (!response.ok || !result.success) {

        throw new Error(

            result.error || "No se pudieron cargar los equipos."

        );

    }

    return result.devices;

}