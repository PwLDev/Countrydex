import WebSocket from "ws";
import fs from "node:fs";
import path from "node:path";
import { Collection } from "@discordjs/collection";
import { Reply } from "./utils/Message.js";
import { IntReply } from "./utils/Interactions.js"


export function initBot(io, data) {
    const ws = new WebSocket("wss://gateway.discord.gg/?v=10&encoding=json");
    var interval = 0, lastPing;

    ws.events = new Map();
    ws.commands = new Collection();
    ws.guildMap = new Map();
    ws.pingMs = "Cargando ping...";
    ws.guildCount = 0;
    ws.loadingState = true;
    ws.loadingStart = Date.now();
    ws.io = io;

    const payload = {
        op: 2,
        d: {
            token: Buffer.from(data.botToken, 'base64').toString('binary'),
            intents: 99851,
            properties: {
                device: "pc",
                browser: "chrome",
                os: process.platform
            },
            presence: {
                status: "online",
                afk: false,
                since: Date.now()
            }
        }
    }

    ws.on("open", () => ws.send(JSON.stringify(payload)));

    fs.readdirSync(path.resolve("./events/")).filter(f => f.endsWith(".js"))
    .forEach(async file => {
        const { default: event } = await import(`./events/${file}`);

        ws.events.set(event.name, event);
    });

    fs.readdirSync(path.resolve("./commands/")).filter(f => f.endsWith(".js"))
    .forEach(async file => {
        const { default: command } = await import(`./commands/${file}`);

        ws.commands.set(command.name, command);
    });

    ws.on("message", (data) => {
        const payload = JSON.parse(data);
        const { d, t, op } = payload;

        switch (op) {
            case 10:
                interval = heartbeat(d.heartbeat_interval);
                io.emit("console_log", `Tiempo de heartbeat recibido: ${d.heartbeat_interval} ms`)

            case 11:
                if (!lastPing) return;
                ws.pingMs = Date.now() - lastPing;
        }

        const event = ws.events.get(t);
        if (!event) return;
        else event.run(ws, d);
    });

    ws.on("close", (code, reason) => {
        if (code === 4000) return;
        io.emit("bot_crash", { code, reason });
        io.emit("console_log", `¡El cliente se ha cerrado!\n\nInformación:\nCódigo: ${code}\n${reason.length > 0 ? "Con la razón de " + reason : "Sin razón"}\n\nSaliendo...`);
        io.emit("bot_status", { name: "crash", render: "Crasheado" })
    });

    const heartbeat = (ms) => { return setInterval(() => { ws.send(JSON.stringify({ op: 1, d: null })); lastPing = Date.now(); }, ms); };

    return ws;
}