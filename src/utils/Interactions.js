import { APIRequest } from "./APIRequest.js";
import { Readable } from "node:stream";
import FormData from "form-data";
import axios from "axios"
import fs from "node:fs"
import path from "node:path";

const DataConfig = JSON.parse(fs.readFileSync(path.resolve("../data/config.json"), { encoding: "utf-8" }));

export function IntReply(interaction, options) {
    APIRequest(`/interactions/${interaction.id}/${interaction.token}/callback`, { method: "POST", body: { type: 4, data: { ...options } } });
}

export function EphemeralReply(interaction, options) {
    APIRequest(`/interactions/${interaction.id}/${interaction.token}/callback`, { method: "POST", body: { type: 4, data: { flags: 1 << 6, ...options } } });
}

export function DeferReply(interaction) {
    APIRequest(`/interactions/${interaction.id}/${interaction.token}/callback`, { method: "POST", body: { type: 5 } });
}

export function EditComponentReply(interaction, options) {
    APIRequest(`/interactions/${interaction.id}/${interaction.token}/callback`, { method: "POST", body: { type: 7, data: { ...options } } });
}

export function EditReply(interaction, options) {
    APIRequest(`/webhooks/1090811431391334520/${interaction.token}/messages/@original`, { method: "PATCH", body: {  ...options } });
}

export async function IntReplyFile(interaction, buffer, filename, options) {
    const tmp = new Readable();
    tmp.push(buffer);
    tmp.push(null);

    var form = new FormData();
    form.append("payload_json", JSON.stringify({ type: 4, data: { ...options } }), { contentType: "application/json" });
    form.append("files[0]", tmp, { filename: filename });

    const res = await axios.post(`https://discord.com/api/v10/interactions/${interaction.id}/${interaction.token}/callback`, form, {
        headers: {
            Authorization: `Bot ${process.env.token}`,
            "Content-Type": "multipart/form-data",
            "User-Agent": "PwLDev (https://github.com/PwLDev)" // Requerido por la API
        },
    }).catch(err => console.error(JSON.stringify(err.response.data)))

    return res;
}

export async function EditReplyFile(interaction, buffer, filename, options) {
    const tmp = new Readable();
    tmp.push(buffer);
    tmp.push(null);

    var form = new FormData();
    form.append("payload_json", JSON.stringify({ ...options }), { contentType: "application/json" });
    form.append("files[0]", tmp, { filename: filename });

    const res = await axios.patch(`https://discord.com/api/v10/webhooks/1090811431391334520/${interaction.token}/messages/@original`, form, {
        headers: {
            Authorization: `Bot ${Buffer.from(DataConfig["botToken"], "base64").toString("binary")}`,
            "Content-Type": "multipart/form-data",
            "User-Agent": "PwLDev (https://github.com/PwLDev)" // Requerido por la API
        },
    }).catch(err => console.error(JSON.stringify(err.response.data)))

    return res;
}