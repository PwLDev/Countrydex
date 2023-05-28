import Express from "express";
import http from "http";
import path from "path";
import { Server } from "socket.io";
import fs from "node:fs";
import { initBot } from "./bot.js";
import WebSocket from "ws";
import { APIRequest } from "./utils/APIRequest.js";
import { publishCommands } from "./deploy.js";


export function initServer(port) {
    const app = Express();
    const server = http.createServer(app);
    const socket = new Server(server);

    app.use(Express.static(path.resolve("./views/")));

    app.get("/", (req, res) => {
        res.sendFile("index.html")
    });

    server.listen(port);

    var botWebSocket = null;

    socket.on("connect", (SocketIO) => {
        SocketIO.on("verify_config", () => {
            if (
                !fs.existsSync(path.resolve("../data/config.json")) ||
                !JSON.parse(fs.readFileSync(path.resolve("../data/config.json"), { encoding: "utf-8" }))?.setup
            ) return SocketIO.emit("verify_config_fail")
            else SocketIO.emit("verify_config_success")
        });

        SocketIO.on("confirm_ready", () => {
            SocketIO.emit("console_log", "Panel de CountryBot v0.7.1");
            SocketIO.emit("console_log", "Listo para iniciar.")
            
            if (botWebSocket instanceof WebSocket) SocketIO.emit("bot_status", { name: "on", render: "Encendido" })
            else SocketIO.emit("bot_status", { name: "off", render: "Apagado" })
        });

        SocketIO.on("settings_save", data => {
            const oldData = JSON.parse(fs.readFileSync(path.join("../data/config.json"), { encoding: "utf-8" }));

            const generatedData = {
                port: oldData.port,
                setup: true,
                botName: data.botName,
                countryballsName: data.countryballsName,
                dexName: data.dexName,
                botToken: data.botToken
            };

            try {
                fs.writeFileSync(path.resolve("../data/config.json"), JSON.stringify(generatedData, null, 2), { encoding: "utf-8" });
                SocketIO.emit("settings_save_success")
            } catch (error) {
                SocketIO.emit("settings_save_fail");
                registerError(error, "al intentar guardar los cambios")
            }
        });

        SocketIO.on("settings_reset", () => {
            const oldData = JSON.parse(fs.readFileSync(path.join("../data/config.json"), { encoding: "utf-8" }));

            const generatedData = {
                port: oldData.port,
                setup: false,
            };

            try {
                fs.writeFileSync(path.resolve("../data/config.json"), JSON.stringify(generatedData, null, 2), { encoding: "utf-8" });
                SocketIO.emit("settings_reset_success")
            } catch (error) {
                SocketIO.emit("settings_reset_fail");
                registerError(error, "al intentar eliminar la configuración")
            }
        });

        SocketIO.on("bot_on", () => {
            const data = JSON.parse(fs.readFileSync(path.join("../data/config.json"), { encoding: "utf-8" }));

            botWebSocket = initBot(SocketIO, data);
            SocketIO.emit("console_log", "Iniciando proceso de inicialización...");
            SocketIO.emit("bot_status", { name: "load", render: "Iniciando" });
        });

        SocketIO.on("bot_off", () => {
            botWebSocket.close(4000);
            SocketIO.emit("console_log", "Cerrando conexión...");
            SocketIO.emit("bot_off_confirm");
            SocketIO.emit("bot_status", { name: "off", render: "Apagado" });
            SocketIO.emit("console_log", "Bot Apagado");
            botWebSocket = null;
        });

        SocketIO.on("bot_publish_commands", () => {
            publishCommands(SocketIO);
        });

        SocketIO.on("has_balls", () => {
            const info = JSON.parse(fs.readFileSync(path.resolve("../data/countryballs.json"), { encoding: "utf-8" })).countryballs;

            if (info.length > 0) SocketIO.emit("has_balls", true)
            else SocketIO.emit("has_balls", false)
        })

        SocketIO.on("get_countryballs_list", () => {
            const info = JSON.parse(fs.readFileSync(path.resolve("../data/countryballs.json"), { encoding: "utf-8" })).countryballs
            if (info.length == 0) return socket.emit("countryballs_list", info);
            else info.forEach((ball, index) => info[index]["spawnImgBuffer"] = fs.readFileSync(path.resolve(`../data/assets/countrydex/spawn/${info[index]["names"][0]}.png`), { encoding: "base64" }))
            SocketIO.emit("countryballs_list", info);
        });

        SocketIO.on("countryball_nametaken", name => {
            const countryballData = JSON.parse(fs.readFileSync(path.resolve("../data/countryballs.json"), { encoding: "utf-8" })).countryballs;

            var nameTaken = false;
            countryballData.forEach(ball => {
                if (ball.names[0] === name) nameTaken = true
                else return;
            });

            SocketIO.emit("countryball_nametaken", nameTaken)
        });

        SocketIO.on("countryball_data_add", data => {
            const spawnImgBuffer = Buffer.from(data.blobSpawnImg, "binary");
            const cardImgBuffer = Buffer.from(data.blobCardImg, "binary");
            const generatedName = data.renderedName.toLowerCase().replace(/[^a-zA-Z0-9]/g, '');
            data.names.unshift(generatedName);
            fs.writeFileSync(path.resolve(`../data/assets/countrydex/spawn/${generatedName}.png`), spawnImgBuffer);
            fs.writeFileSync(path.resolve(`../data/assets/countrydex/cards/${generatedName}.png`), cardImgBuffer);

            const countryballData = JSON.parse(fs.readFileSync(path.resolve("../data/countryballs.json"), { encoding: "utf-8" }));

            countryballData.countryballs.push({
                names: data.names,
                renderedName: data.renderedName,
                defaultHp: data.defaultHp,
                defaultAtk: data.defaultAtk,
                emoji: data.emoji
            });

            try {
                fs.writeFileSync(path.resolve("../data/countryballs.json"), JSON.stringify(countryballData, null, 2), { encoding: "utf-8" });
                SocketIO.emit("countryball_add_success")
            } catch (error) {
                SocketIO.emit("countryball_add_fail");
                registerError(error, "al intentar añadir un nuevo Countryball");
            }
        });

        SocketIO.on("countryball_delete", index => {
            const countryballData = JSON.parse(fs.readFileSync(path.resolve("../data/countryballs.json"), { encoding: "utf-8" }));

            try {

                countryballData.countryballs.splice(index, 1);
                fs.writeFileSync(path.resolve("../data/countryballs.json"), JSON.stringify(countryballData, null, 2), { encoding: "utf-8" });

                SocketIO.emit("countryball_delete_success");
            } catch (error) {
                SocketIO.emit("countryball_delete_fail");
                registerError(error, "al intentar eliminar el countryball")
            }
        });
    });

    console.info(`¡Panel iniciado correctamente!\nVisita la página "http://localhost:${port}" en tu navegador preferido.\nPara cerrar el panel, cierra esta ventana o presiona Ctrl + C.`)
}

function registerError(error, when) { console.error("=====================\n", `Se registró un error ${when}:\n`, error, "--------------------\nSi el error persiste, contáctate con el desarrollador.\n===================="); }