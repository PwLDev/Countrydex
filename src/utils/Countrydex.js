import { generate } from "@pwldev/discord-snowflake";
import { SendFile } from "./Message.js";
import { createRequire } from "node:module";
import Store from "data-store";

import fs from "node:fs";
import path from "node:path";
import { Send } from "./Message.js";

const require = createRequire(import.meta.url);
const countryballData = require(path.resolve("../data/countryballs.json"));

var spawns = new Store({ path: path.join(process.cwd() + "/countrydex/spawns.json") });

export async function SpawnRandomCountryball(message) {
    const DataConfig = JSON.parse(fs.readFileSync(path.resolve("../data/config.json"), { encoding: "utf-8" }));
    const snowflakeId = generate(Date.now()).toString();
    const randomCountryball = countryballData.countryballs[Math.floor(Math.random() * countryballData.countryballs.length)]
    const req = await SendFile(
        { channel_id: message },
        fs.readFileSync(path.resolve(`../data/assets/countrydex/spawn/${randomCountryball.names[0]}.png`)),
        `countryball_${snowflakeId}.png`,
        {
            content: "¡Ha aparecido un " + DataConfig["countryballsName"] + "!",
            attachments: [{ id: 0, filename: `countryball_${snowflakeId}.png`, url: `attachment://countryball_${snowflakeId}.png` }],
            components: [{
                type: 1,
                components: [{
                    type: 2,
                    style: 1,
                    custom_id: `cbspawn_${snowflakeId}`,
                    label: "Atrápame"
                }]
            }]
        }
    ).catch(error => {
        return Send(message, { content: "Lo siento, ocurrió un error al aparecer un" + DataConfig["countryballsName"] })
    })

    if (!req.data) return;
    const messageId = req.data.id;

    spawns.set(snowflakeId, {
        catched: false,
        message: {
            channel_id: message,
            id: messageId
        },
        data: randomCountryball
    });

    setTimeout(() => {
        if (!spawns.get(snowflakeId + ".catched")) Edit(spawns.get(snowflakeId + ".message"), {
            components: [{
                type: 1,
                components: [{
                    type: 2,
                    style: 1,
                    custom_id: `cbspawn_${snowflakeId}`,
                    label: "Atrápame",
                    disabled: true
                }]
            }]
        });

        spawns.del(snowflakeId)
    }, (3 * 60000));
}