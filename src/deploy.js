import { APIRequest } from "./utils/APIRequest.js";
import fs from "node:fs";
import path from "node:path";

export function publishCommands(io) {
    const DataConfig = JSON.parse(fs.readFileSync(path.resolve("../data/config.json"), { encoding: "utf-8" }));
    if (!DataConfig.hasOwnProperty("clientId")) {
        io.emit("bot_crash", { code: "101", reason: "No se pudo publicar los comandos debido a que no se encontró el ID del cliente. Esto debería resolverse la próxima vez que encienda el bot." })
        io.emit("console_log", `¡El cliente se ha cerrado!\n\nInformación:\nCódigo: 101\nNo se pudo publicar los comandos debido a que no se encontró el ID del cliente. Esto debería resolverse la próxima vez que encienda el bot.\n\nSaliendo...`);
        return;
    }
    
    var availableCommands = [{}];

    fs.readdirSync(path.resolve("./commands/")).filter(f => f.endsWith(".js"))
    .forEach(async file => {
        const { default: command } = await import(`./commands/${file}`);

        if (!command.data) return;
        availableCommands.unshift(command.data)
    });

    setTimeout(() => {
        io.emit("console_log", "Actualizando los comandos...\nEsto llevará unos minutos, por favor espera...\n")

        availableCommands.forEach((cmd, index) => {
            setTimeout(() => {
                if (index === availableCommands.length - 1) {
                    io.emit("console_log", `Se terminó de actualizar los comandos.`);
                    io.emit("command_publish_success");
                    return;
                }

                try {
                    APIRequest(`/applications/${DataConfig["clientId"]}/commands`, { method: "POST", body: cmd });
                } catch (error) {
                    io.emit("command_publish_warning", `No se pudo publicar el comando ${cmd.name}.\nMás información fue impresa en la consola de Administración.`);
                    io.emit("console_log", String(error))
                }

                io.emit("console_log", `Se actualizó el comando /${cmd.name}`);
            }, (3000 * index))
        });

    }, 1000)
}