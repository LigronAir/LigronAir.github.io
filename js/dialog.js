// ==========================================================
// LigronLink
// Dialog Component V1
// ==========================================================

class LigronDialog {

    constructor() {

        this.create();

    }

    // ======================================================
    // Crear el diálogo
    // ======================================================

    create() {

        this.overlay = document.createElement("div");
        this.overlay.className = "ligron-dialog-overlay";

        this.overlay.innerHTML = `

            <div class="ligron-dialog">

                <div class="ligron-dialog-header">

                    <h2 class="ligron-dialog-title"></h2>

                    <button
                        class="ligron-dialog-close"
                        type="button">

                        ✕

                    </button>

                </div>

                <div class="ligron-dialog-body"></div>

                <div class="ligron-dialog-footer"></div>

            </div>

        `;

        document.body.appendChild(this.overlay);

        this.title =
            this.overlay.querySelector(".ligron-dialog-title");

        this.body =
            this.overlay.querySelector(".ligron-dialog-body");

        this.footer =
            this.overlay.querySelector(".ligron-dialog-footer");

        this.overlay
            .querySelector(".ligron-dialog-close")
            .addEventListener("click", () => {

                this.close();

            });

        this.overlay.addEventListener("click", (event) => {

            if (event.target === this.overlay) {

                this.close();

            }

        });

        document.addEventListener("keydown", (event) => {

            if (
                event.key === "Escape" &&
                this.overlay.classList.contains("open")
            ) {

                this.close();

            }

        });

    }

    // ======================================================
    // Abrir
    // ======================================================

    open(options = {}) {

        this.title.textContent =
            options.title ?? "";

        this.body.innerHTML =
            options.content ?? "";

        this.footer.innerHTML = "";

        if (options.buttons) {

            options.buttons.forEach(button => {

                const element =
                    document.createElement("button");

                element.className =
                    "ligron-button " +
                    (button.class || "secondary");

                element.textContent =
                    button.text;

                element.addEventListener(
                    "click",
                    () => {

                        if (button.action) {

                            button.action();

                        }

                    });

                this.footer.appendChild(element);

            });

        }

        this.overlay.classList.add("open");

    }

    // ======================================================
    // Cerrar
    // ======================================================

    close() {

        this.overlay.classList.remove("open");

    }

}

// ==========================================================
// Instancia global
// ==========================================================

window.dialog = new LigronDialog();