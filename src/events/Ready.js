import Store from "data-store";
import path from "node:path";
import fs from "node:fs";
import { SpawnRandomCountryball } from "../utils/Countrydex.js";
import { count } from "node:console";
import { WebConsoleLog } from "../utils/Console.js";

var countrydexConfig = new Store({ path: path.join(process.cwd() + "/countrydex/config.json"), debounce: 0 });
var triggers = new Store({ path: path.join(process.cwd() + "/countrydex/triggers.json"), debounce: 0 });
var spawns = new Store({ path: path.join(process.cwd() + "/countrydex/spawns.json") });
var owns = new Store({ path: path.join(process.cwd() + "/countrydex/owns.json") });

export { triggers, countrydexConfig, spawns, owns }

export default {
    name: "READY",
    run: (ws, d) => {
        const DataConfig = JSON.parse(fs.readFileSync(path.resolve("../data/config.json"), { encoding: "utf-8" }));
        WebConsoleLog(ws.io, `Conectado como ${d.user.username}#${d.user.discriminator}`);
        ws.avatarURL = `https://cdn.discordapp.com/avatars/${d.user.id}/${d.user.avatar}.png`
        ws.getAvatarURL = (user) =>`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`;

        ws.io.emit("bot_status", { name: "on", render: "Encendido" });
        ws.io.emit("bot_on_confirm");

        if (!DataConfig.hasOwnProperty("clientId")) {
            DataConfig["clientId"] = d.application.id;

            fs.writeFileSync(path.resolve("../data/config.json"), JSON.stringify(DataConfig, null, 2),{ encoding: "utf-8" })
        }

        setTimeout(() => WebConsoleLog(ws.io, `El bot está activo en ${ws.guildCount} servidores.`), 5000)
        setInterval(() => {
            triggers.load();

            countrydexConfig.load();

            spawns.load();

            owns.load();
        }, 1500)
    }
}