// ==========================================================
// LigronAir
// session.js
// Gestión de sesión del navegador
// ==========================================================

export function saveUser(user) {

    localStorage.setItem(

        "ligronUser",

        JSON.stringify(user)

    );

}

export function getUser() {

    const data = localStorage.getItem("ligronUser");

    if (!data) {

        return null;

    }

    return JSON.parse(data);

}

export function logout() {

    localStorage.removeItem("ligronUser");

    window.location.href = "index.html";

}