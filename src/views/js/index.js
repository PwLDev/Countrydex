var socket = io(), loaded = false, pagesRan = [], countryballAddCache = {};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

window.addEventListener("load", () => {
    document.querySelectorAll("a").forEach(element => {
        if (element.id.startsWith("nav_")) element.addEventListener("click", () => loadPage(element.id.substring(4, element.id.length)))
    });

    $.ajax({
        url: `../html/home.html`,
        success: async (data) => {
            document.querySelectorAll("a").forEach(element => {
                if (element.classList.contains("nav-link")) element.classList = "nav-link text-white"
                if (element.id === `nav_home`) element.classList += " active"
            })

            document.querySelectorAll("li").forEach(element => {
                if (!element.classList.contains("nav-link") && element.id.startsWith("nav_")) element.classList = "nav-item"
            })

            $("#page-content").fadeOut(450, () => $("#page-content").html(data).fadeIn(450))

            // All functions go here!
            await delay(1000)

            toastr.options = {
                "closeButton": true,
                "debug": false,
                "newestOnTop": false,
                "progressBar": true,
                "positionClass": "toast-top-right",
                "preventDuplicates": false,
                "onclick": null,
                "showDuration": "300",
                "hideDuration": "1000",
                "timeOut": "6400",
                "extendedTimeOut": "1500",
                "showEasing": "swing",
                "hideEasing": "linear",
                "showMethod": "fadeIn",
                "hideMethod": "fadeOut"
            }

            // Load Socket related stuff only one time
            
            socket.on("verify_config_fail", () => {
                var modal = new bootstrap.Modal("#alert_modal");
                modal.toggle();
                $("#alert_modal_label").html("<b>¡No has configurado al bot!</b>")
                $("#alert_modal_msg").html("Puedes configurarlo en la sección de <b>Configuración</b>.")
            });

            socket.on("verify_config_success", () => {
                socket.emit("has_balls");
                socket.on("has_balls", hasBalls => {
                    if (!hasBalls) return toastr.error("No hay countryballs creados, por lo tanto el bot no funcionará correctamente. Puedes crearlos en el apartado de Countryballs.", "No hay countryballs")
                    else {
                        socket.emit("bot_on");
                        $("#poweron").addClass("disabled");
                        $("#poweroff").removeClass("disabled")
                    }
                })
            })

            socket.on("console_log", (data) => {
                var p = document.createElement("p");
                p.classList = "mb-0"
                p.innerText = data;
                document.getElementById("console_container").appendChild(p);


                var elem = document.getElementById('console_container');
                elem.scrollTop = elem.scrollHeight;
            });

            socket.on("bot_status", data => {
                if (data.name === "on") {
                    $("#poweron").addClass("disabled");
                    $("#poweroff").removeClass("disabled");
                    $("#publish_commands").addClass("disabled")
                } else {
                    $("#poweroff").addClass("disabled");
                    $("#poweron").removeClass("disabled");
                    $("#publish_commands").removeClass("disabled")
                }

                $("#bot_status").html(data.render);
            });

            socket.on("bot_crash", data => {
                toastr.error("Algo salió mal y el bot ha crasheado. Se imprimió más información en la consola del Panel de Administración. Si este error persiste, contáctate con el desarrollador.", "¡El bot ha crasheado!");

                $("#poweroff").addClass("disabled");
                $("#poweron").removeClass("disabled")
            });

            socket.on("bot_on_confirm", () => toastr.success("Bot iniciado correctamente."));
            socket.on("bot_off_confirm", () => {
                toastr.success("Bot apagado correctamente.");

                $("#poweroff").addClass("disabled");
                $("#poweron").removeClass("disabled")
            });

            // Socket Events
            socket.on("command_publish_warning", data => toastr.warning(data, "Hubo un problema al publicar los comandos."));
            socket.on("command_publish_success", () => {
                toastr.success("Se publicaron los comandos correctamente.");

                $("#publish_commands").removeClass("disabled");
                $("#poweron").removeClass("disabled");
            });

            socket.on("settings_save_success", () => toastr.success("Se guardaron todos los cambios correctamente.", "Cambios guardados"));
            socket.on("settings_save_fail", () => toastr.error("Lo sentimos, ocurrió un error al intentar guardar los cambios. Más información acerca del error fue impreso en la consola (del archivo).", "No se pudo guardar los cambios"));

            socket.on("settings_reset_success", () => toastr.success("Se eliminó toda la configuración correctamente.", "Configuración reestablecida"));
            socket.on("settings_reset_fail", () => toastr.error("Lo sentimos, ocurrió un error al intentar eliminar la configuración. Más información acerca del error fue impreso en la consola.", "No se pudo reestablecer los cambios"));

            socket.on("countryball_add_success", () => {
                toastr.success("Se añadió correctamente el countryball.", "Countryball Creado");
                loadPage("add_countryballs")
            });
            socket.on("countryball_add_fail", () => toastr.error("Lo sentimos, ocurrió un error al intentar añadir el countryball. Más información acerca del error fue impreso en la consola (del archivo).", "No se pudo añadir el countryball"));

            socket.on("countryball_delete_success", () => {
                toastr.success("Se eliminó este countryball correctamente.", "Countryball Eliminado")
                
                socket.emit("get_countryballs_list");
        
                socket.on("countryballs_list", data => {
                    if (data.length == 0) return $("#countryballs_list").html("<h5>¡No hay countryballs por aquí! ¿Se habrán escapado? Crea uno nuevo arriba.</h5>");
        
                    $("#countryballs_list").html("");
        
                    data.forEach((countryball, index) => {
                        $("#countryballs_list").append($(
                            `
                            <div class="card-group p-2 mb-2" style="background:#bcbcbc; border-radius: 10px;">
                                <div class="d-flex flex-row flex-shrink-0 mb-4 mb-md-0 me-md-auto align-items-center">
                                    <img class="me-2" src="data:image/png;base64,${countryball.spawnImgBuffer}" width="50" height="50">
                                    <h3 class="m-0 text-black">${countryball.renderedName}</h5>
                                </div>
                                <br>
                                <div class="d-flex flex-row align-items-center me-2">
                                    <button class="btn btn-secondary me-2">Editar</button>
                                    <button class="btn btn-danger" onclick="deleteCountryball(${index});">Borrar</button>
                                </div>
                            </div>
                            `
                        ));
                    });
                });
            });
            socket.on("countryball_delete_fail", () => toastr.error("Lo sentimos, ocurrió un error al intentar eliminar el countryball. Más información acerca del error fue impreso en la consola.", "No se pudo eliminar el countryball"));

            homePage();
        }
    });

    
    function loadPage(filename) {
        $.ajax({
            url: `../html/${filename}.html`,
            success: async (data) => {
                document.querySelectorAll("a").forEach(element => {
                    if (element.classList.contains("nav-link")) element.classList = "nav-link text-white"
                    if (element.id === `nav_${filename}`) element.classList += " active"
                })
    
                document.querySelectorAll("li").forEach(element => {
                    if (!element.classList.contains("nav-link") && element.id.startsWith("nav_")) element.classList = "nav-item"
                })
    
                $("#page-content").fadeOut(450, () => $("#page-content").html(data).fadeIn(450))    
                // All functions go here!
                await delay(1200)

                // LOAD EVERYTHING
                if (filename === "home") homePage();
                else if (filename === "settings") settingsPage();
                else if (filename === "add_countryballs") countryballsPage();
                else if (filename === "countryball_create") addCountryballsPage();
            }
        })
    }


    function homePage() {
        document.getElementById("poweron").addEventListener("click", () => socket.emit("verify_config"));
        document.getElementById("poweroff").addEventListener("click", () => socket.emit("bot_off"));
        
        document.querySelectorAll(".collapse_arrow")
        .forEach(element => {
            element.addEventListener("click", () => {
                if (element.classList.contains("bi-chevron-down")) element.classList = "bi bi-chevron-up"
                else element.classList = "bi bi-chevron-down"
            })
        })

        socket.emit("confirm_ready");

        $("#publish_commands").on("click", element => {
            socket.emit("bot_publish_commands");

            $("#publish_commands").addClass("disabled");
            $("#poweroff").addClass("disabled");
            $("#poweron").addClass("disabled");

            toastr.info("Se empezarán a publicar los comandos.\nEsto puede tardar unos minutos, por favor espera...");
        });

        // Make sure only one backdrop is rendered 
        $(".modal").on('show.bs.modal', () => {
            (async () => await delay(150))();
            if ($(".modal-backdrop").length > 1) {

                $(".modal-backdrop").not(':first').remove();                
            }

            $(".modal-footer").html(`<button type="button" id="close_btn" data-backdrop="true" data-dismiss="modal"  class="btn btn-secondary btn-round" data-bs-dismiss="modal" data-bs-target="#alert_modal" href="#alert_modal" onclick="removeBackdrop();">Cerrar</button>`);
        });
        // Remove all backdrop on close
        $(".modal").on('hide.bs.modal', () => {
            if ($(".modal-backdrop").length > 1) {
                $(".modal-backdrop").remove();
            }
            $(".modal-footer").html("")
        });
    }

    function settingsPage() {
        $("#settings_reset").on("click", () => {
            var modal = new bootstrap.Modal("#alert_modal");
            modal.toggle();
            $("#alert_modal_label").html("<b>¿Seguro de que deseas hacer esto?</b>")
            $("#alert_modal_msg").html("¡Esto es irreversible! ¿Deseas continuar y eliminar todos los datos?");
            $("#alert_modal_footer").append(`<button type="button" onclick="resetData();" class="btn btn-danger btn-round me-1">Eliminar datos</button>`)
        })

        $("#settings_form").on("submit", (element) => {
            element.preventDefault();
            
            const botName = $("#settings_botname").val();
            const countryballsName = $("#settings_ballsname").val();
            const dexName = $("#settings_botdexname").val();
            const botToken = $("#settings_token").val();

            if (
                botName.length == 0 ||
                countryballsName.length == 0 ||
                dexName.length == 0 ||
                botToken.length == 0
            ) return toastr.warning("Se requiere llenar todos los campos del formulario, asegúrate de llenarlos todos.", "Campos requeridos")

            if (!/[\w-]{24}\.[\w-]{6}\.[\w-]{27}/.test(botToken)) return toastr.warning("Al parecer este no es un token válido, si no tienes uno, o no sabes cómo obtenerlo, <a target=\"_blank\" href=\"https://www.ionos.mx/digitalguide/servidores/know-how/discord-bot/#c404697\">visita esta página</a> que puede ayudarte.", "Token inválido")

            const encryptedToken = window.btoa(botToken);
            socket.emit("settings_save", { botName, countryballsName, dexName, botToken: encryptedToken });
        });
    }

    function countryballsPage() {
        socket.emit("get_countryballs_list");

        socket.on("countryballs_list", data => {
            if (data.length == 0) return $("#countryballs_list").html("<h5>¡No hay countryballs por aquí! ¿Se habrán escapado? Crea uno nuevo arriba.</h5>");

            $("#countryballs_list").html("");

            data.forEach((countryball, index) => {
                $("#countryballs_list").append($(
                    `
                    <div class="card-group p-2 mb-2" style="background:#bcbcbc; border-radius: 10px;">
                        <div class="d-flex flex-row flex-shrink-0 mb-4 mb-md-0 me-md-auto align-items-center">
                            <img class="me-2" src="data:image/png;base64,${countryball.spawnImgBuffer}" width="64" height="64">
                            <h3 class="m-0 text-black">${countryball.renderedName}</h5>
                        </div>
                        <br>
                        <div class="d-flex flex-row align-items-center me-2">
                            <button class="btn btn-secondary me-2">Editar (Próximamente)</button>
                            <button class="btn btn-danger" onclick="deleteCountryball(${index});">Borrar</button>
                        </div>
                    </div>
                    `
                ));
            });
        });

        $("#add_countryball").on("click", () => loadPage("countryball_create"))
    }

    function addCountryballsPage() {
        var spawnImgResult = null, cardImgResult = null, namesArray;
        const spawnImg = $("#countryball_spawnimg");
        const cardImg = $("#countryball_cardimg");

        spawnImg.on("change", event => spawnImgResult = URL.createObjectURL(event.target.files[0]))
        cardImg.on("change", event => cardImgResult = URL.createObjectURL(event.target.files[0]));

        $("#countryball_name").val();
        $("#countryball_alias").val("");
        $("#countryball_hp").val();
        $("#countryball_atk").val("");
        $("#countryball_emoji").val("");

        $("#countryball_form").on("submit", async el => {
            el.preventDefault();

            const name = $("#countryball_name").val();
            const alias = $("#countryball_alias").val();
            const hp = $("#countryball_hp").val();
            const atk = $("#countryball_atk").val();
            const emojiCode = $("#countryball_emoji").val();

            if (
                name.length == 0 ||
                hp.length == 0 ||
                atk.length == 0 ||
                emojiCode.length == 0 ||
                spawnImgResult == null ||
                cardImgResult == null
            ) return toastr.warning("Se requiere llenar todos los campos del formulario, asegúrate de llenarlos todos.", "Campos requeridos")

            namesArray = alias.length == 0 ? [] : alias.split(",");
            const spawnblobData = await fetch(spawnImgResult).then(r => r.blob());
            const cardblobData = await fetch(cardImgResult).then(r => r.blob());

            socket.emit("countryball_nametaken", name.toLowerCase().replace(/[^a-zA-Z0-9]/g, ''))

            socket.on("countryball_nametaken", async isTaken => {
                if (isTaken) return toastr.warning("Al parecer ya hay una ball con ese nombre.", "Nombre ya existente")
                else {
        
                    socket.emit("countryball_data_add", {
                        names: namesArray,
                        renderedName: name,
                        defaultHp: parseInt(hp),
                        defaultAtk: parseInt(atk),
                        emoji: emojiCode,
                        blobSpawnImg: spawnblobData,
                        blobCardImg: cardblobData
                    });
                }
            });
        });

        $("#countryball_cancel").on("click", () => loadPage("add_countryballs"));
    }
});

function removeBackdrop() {
    if ($(".modal-backdrop").length > 0) $('.modal-backdrop').remove()
    $(document.body).removeClass("modal-open");
}

function resetData() {
    $("#close_btn")[0].click();
    socket.emit("settings_reset");

}

function deleteCountryball(countryballIndex) {
    var modal = new bootstrap.Modal("#alert_modal");
    modal.toggle();
    $("#alert_modal_label").html("<b>¿Seguro de que deseas hacer esto?</b>")
    $("#alert_modal_msg").html("¡Esto es irreversible! ¿Deseas continuar y eliminar a este countryball?. Se eliminará todo el contenido, imágenes, datos y más.");
    $("#alert_modal_footer").append(`<button type="button" onclick="deleteProcessCountryball(${countryballIndex});" class="btn btn-danger btn-round me-1">Eliminar Countryball</button>`)
}

function deleteProcessCountryball(countryballIndex) {
    $("#close_btn")[0].click();

    socket.emit("countryball_delete", parseInt(countryballIndex));
}

function editCountryball(index) {
    $.ajax({
        url: `../html/countryball_edit.html`,
        success: async (data) => {
            document.querySelectorAll("a").forEach(element => {
                if (element.classList.contains("nav-link")) element.classList = "nav-link text-white"
                if (element.id === `nav_countryball_edit`) element.classList += " active"
            })

            document.querySelectorAll("li").forEach(element => {
                if (!element.classList.contains("nav-link") && element.id.startsWith("nav_")) element.classList = "nav-item"
            })

            $("#page-content").fadeOut(450, () => $("#page-content").html(data).fadeIn(450))    
            // All functions go here!
            await delay(1200)

            socket.emit("get_countryballs_list");

            socket.on("countryballs_list", data => {
                const ballInfo = data[index];
                ballInfo.names.shift();
                var renderedAliases = "";
    
                ballInfo.names.forEach((name, index) => renderedAliases += `${index == 0 ? "" : ","}${name}`)
    
                $("#countryball_name").val(ballInfo.renderedName)
                $("#countryball_alias").val(renderedAliases);
                $("#countryball_hp").val(ballInfo.defaultHp)
                $("#countryball_atk").val(ballInfo.defaultAtk)
                $("#countryball_emoji").val(ballInfo.emoji)
            });
        }
    })
}