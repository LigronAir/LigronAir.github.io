// ==========================================================
// LigronAir
// session.js
// Gestión de sesión del navegador
// ==========================================================

export function saveUser(user, accessToken, expiresIn) {
    localStorage.setItem(
        "ligronUser",
        JSON.stringify({
            ...user,
            accessToken,
            expiresAt: Date.now() + (Number(expiresIn) * 1000)
        })
    );
}

export function getUser() {
    const data = localStorage.getItem("ligronUser");
    if (!data) return null;

    try {
        const user = JSON.parse(data);
        if (!user?.accessToken || !Number.isFinite(Number(user.expiresAt)) || Number(user.expiresAt) <= Date.now()) {
            localStorage.removeItem("ligronUser");
            return null;
        }
        return user;
    }
    catch {
        localStorage.removeItem("ligronUser");
        return null;
    }
}

export function getAccessToken() {
    const user = getUser();
    if (!user) throw new Error("La sesión ha caducado. Inicie sesión de nuevo.");
    return user.accessToken;
}

export async function logout() {
    const user = getUser();
    if (user?.accessToken) {
        try {
            await fetch("https://api.ligronair.tv/api/v1/logout", {
                method: "POST",
                headers: { "Authorization": `Bearer ${user.accessToken}` }
            });
        }
        catch {
            // Eliminar localmente sigue siendo correcto si Link no responde.
        }
    }
    localStorage.removeItem("ligronUser");
    window.location.href = "index.html";
}
