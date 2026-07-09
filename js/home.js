/* ==========================================================
   LigronLink
   Home
   ========================================================== */

document.addEventListener("DOMContentLoaded", () => {

    console.log("LigronLink V0.4");

    const session = JSON.parse(
        localStorage.getItem("ligronair_session") || "{}"
    );

    if (!session.email) {

        window.location.href = "login.html";

        return;

    }

    console.log("Usuario autenticado:", session.email);

});