import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";
import fetch from "node-fetch";
dotenv.config();

export async function APIRequest(endpoint, options) {
    const DataConfig = JSON.parse(fs.readFileSync(path.resolve("../data/config.json"), { encoding: "utf-8" }));

    if (options.body && typeof options.body === "object") options.body = JSON.stringify(options.body);
    const url = "https://discord.com/api/v10" + endpoint;

    const res = await fetch(url, {
        headers: {
            Authorization: `Bot ${Buffer.from(DataConfig["botToken"], "base64").toString("binary")}`,
            "Content-Type": "application/json",
            "User-Agent": "PwLDev (https://github.com/PwLDev)" // Requerido por la API
        },
        ...options
    });

    if (!res.ok) console.error(JSON.stringify(await res.json()));

    return res;
}