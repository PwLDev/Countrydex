import FormData from "form-data";
import { APIRequest } from "./APIRequest.js";
import { Readable } from "node:stream";
import axios from "axios";
import fs from "node:fs"
import path from "node:path";

const DataConfig = JSON.parse(fs.readFileSync(path.resolve("../data/config.json"), { encoding: "utf-8" }));

export function Send(message, options) {
    APIRequest(`/channels/${message.channel_id}/messages`, { method: "POST", body: { ...options } });
}

export function Edit(message, options) {
    APIRequest(`/channels/${message.channel_id}/messages/${message.id}`, { method: "PATCH", body: { ...options } });
}

export function Reply(message, options) {
    const res = APIRequest(`/channels/${message.channel_id}/messages`, {
        method: "POST",
        body: {
            ...options,
            message_reference: {
                message_id: message.id,
                channel_id: message.channel_id
            }
        } 
    });

    return res;
}

export async function SendFile(message, buffer, filename, options) {
    const tmp = new Readable();
    tmp.push(buffer);
    tmp.push(null);

    var form = new FormData();
    form.append("payload_json", JSON.stringify({ ...options }), { contentType: "application/json" });
    form.append("files[0]", tmp, { filename: filename });

    const res = await axios.post(`https://discord.com/api/v10/channels/${message.channel_id}/messages`, form, {
        headers: {
            Authorization: `Bot ${Buffer.from(DataConfig["botToken"], "base64").toString("binary")}`,
            "Content-Type": "multipart/form-data",
            "User-Agent": "PwLDev (https://github.com/PwLDev)" // Requerido por la API
        },
    }).catch(err => console.error(err.response.data))

    return res;
}