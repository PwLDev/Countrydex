import { EditComponentReply, EphemeralReply, EditReply, IntReply, EditReplyFile } from "../utils/Interactions.js";
import { Edit, Reply } from "../utils/Message.js";
import { APIRequest } from "../utils/APIRequest.js";
import { createRequire } from "node:module";

import Store from "data-store";
import path from "node:path";

import { owns, spawns } from "./Ready.js";
import { luckyMap } from "../commands/Countrydex.js";
import { generate } from "@pwldev/discord-snowflake";
import { createCanvas, loadImage, registerFont } from "canvas";

const require = createRequire(import.meta.url);
const countryballData = require(path.resolve("../data/countryballs.json"));

export default {
    name: "INTERACTION_CREATE",
    run: (ws, d) => {
        if (d.type === 3) {
            if (d.data.custom_id.startsWith("cbspawn_")) {
                const snowflakeId = d.data.custom_id.substring(8, d.data.custom_id.length);

                return APIRequest(`/interactions/${d.id}/${d.token}/callback`, {
                    method: "POST",
                    body: {
                        type: 9,
                        data: {
                            title: "Adivina el Countryball",
                            custom_id: `cbmodal_${snowflakeId}`,
                            components: [{
                                type: 1,
                                components: [{
                                    type: 4,
                                    custom_id: `cbguess_${snowflakeId}`,
                                    label: "Nombre del countryball",
                                    style: 1,
                                    required: true
                                }]
                            }]
                        }
                    }
                })
            }

            if (d.data.custom_id.startsWith("luckspin_")) {
                const authorId = d.data.custom_id.substring(9, d.data.custom_id.length);
                if (d.member.user.id !== authorId) return EphemeralReply(d, { content: "Lo siento, esta ruleta no puede ser controlada por tí.\nUsa `/countryballs luckyspin` para usar la ruleta." });
                else {
                    if (luckyMap.has(d.member.user.id) && luckyMap.get(d.member.user.id)?.used) {
                        return EditComponentReply(d, {
                            embeds: [{
                                color: 0xcc0000,
                                author: { name: "CountryDex", icon_url: ws.avatarURL },
                                footer: { text: `Solicitado por ${interaction.member.user.username}`, icon_url: ws.getAvatarURL(interaction.member.user) },
                                description: `:x: ¡Ya giraste la ruleta de la suerte!\nPodrás volver a girarla <t:${Math.floor(luckyMap.get(interaction.member.user.id)?.finishes / 1000)}:R>`,
                            }],
                            components: [{
                                type: 1,
                                components: [{
                                    type: 2,
                                    custom_id: `luckspin_${d.member.user.id}`,
                                    style: 1,
                                    label: "Girar",
                                    disabled: true
                                }]
                            }]
                        });
                    }

                    EditComponentReply(d, {
                        embeds: [{
                            color: 0x2b7fdf,
                            author: { name: "CountryDex", icon_url: ws.avatarURL },
                            title: "Ruleta de la suerte",
                            description: "Veamos que decidirá la ruleta...",
                            image: { url: "https://cdn.discordapp.com/attachments/1091932806206201857/1099813354433937509/ezgif.com-gif-maker_4.gif" },
                            footer: { text: `Solicitado por ${d.member.user.username}`, icon_url: ws.getAvatarURL(d.member.user) },
                        }],
                        components: [{
                            type: 1,
                            components: [{
                                type: 2,
                                custom_id: `luckspin_${d.member.user.id}`,
                                style: 1,
                                label: "Girar",
                                disabled: true
                            }]
                        }]
                    });

                    setTimeout(async () => {
                        const { countryballs } = countryballData;
                        const randomSelection = Math.floor(Math.random() * ((countryballs.length * 2) - 0) + 0)
    
                        if (randomSelection > countryballs.length - 1) return EditReply(d, {
                            embeds: [{
                                color: 0x2b7fdf,
                                author: { name: "CountryDex", icon_url: ws.avatarURL },
                                title: "Ruleta de la suerte",
                                image: { url: "https://cdn.discordapp.com/attachments/1091932806206201857/1099800543985156157/spinlose.png" },
                                footer: { text: `Solicitado por ${d.member.user.username}`, icon_url: ws.getAvatarURL(d.member.user) },
                            }]
                        });

                        else {
                            const cbData = countryballs[randomSelection];
                            const snowflakeId = generate(Date.now()).toString()
                            if (!owns.has(d.member.user.id)) owns.set(d.member.user.id, []);

                            const randomPercentage1 = Math.floor(Math.random() * (20 - -20) + -20);
                            const randomPercentage2 = Math.floor(Math.random() * (20 - -20) + -20);

                            const calculatedHp = Math.floor(randomPercentage1 > 0 ? (cbData.defaultHp * (randomPercentage1 / 100 + 1)) : (cbData.defaultHp - (cbData.defaultHp * (Math.abs(randomPercentage1)) / 100)));
                            const calculatedAtk = Math.floor(randomPercentage2 > 0 ? (cbData.defaultAtk * (randomPercentage2 / 100 + 1)) : (cbData.defaultAtk - (cbData.defaultAtk * (Math.abs(randomPercentage2)) / 100)));

                            console.log(calculatedAtk, calculatedHp)

                            owns.union(d.member.user.id, {
                                data: cbData,
                                id: snowflakeId,
                                catchDate: Math.floor(Date.now() / 1000),
                                percentages: [randomPercentage1, randomPercentage2],
                                hp: calculatedHp,
                                atk: calculatedAtk,
                                spinObtained: true
                            });

                            const canvas = createCanvas(532, 469);
                            const ctx = canvas.getContext("2d");

                            registerFont(path.resolve("./assets/countrydex/fonts/BobbyJonesSoftRegular400.otf"), { family: "Bobby Jones Soft Regular" })
                            const backgroundImage = await loadImage(path.resolve(`./assets/countrydex/static/spinwin.png`))
                            ctx.drawImage(backgroundImage, 0, 0, 532, 469)

                            ctx.font = "50px Bobby Jones Soft";

                            ctx.fillStyle = "#ffffff";
                            ctx.fillText(`${cbData.renderedName}!`, 45, 95);

                            const cbImg = await loadImage(path.resolve(`./assets/countrydex/spawn/${cbData.names[0]}.png`))
                            ctx.drawImage(cbImg, 370, 275, cbImg.width / 7.5, cbImg.height / 7.5);

                            EditReplyFile(d, canvas.toBuffer("image/png"), `countryball_${snowflakeId}.png`, {
                                embeds: [{
                                    color: 0x2b7fdf,
                                    author: { name: "CountryDex", icon_url: ws.avatarURL },
                                    title: "Ruleta de la suerte",
                                    image: { url: `attachment://countryball_${snowflakeId}.png` },
                                    footer: { text: `Solicitado por ${d.member.user.username}`, icon_url: ws.getAvatarURL(d.member.user) },
                                }]
                            });

                            if (
                                d.member.user.id === "779464887231447073"
                                || d.member.user.id === "626928937355706373"
                                || d.member.user.id === "850557709040353290"
                                || d.member.user.id === "1062470869781332070"
                                || d.member.user.id === "1068377034444779612"
                            ) return;

                            luckyMap.set(d.member.user.id, {
                                used: true, 
                                started: Date.now(),
                                finishes: Date.now() + 7200000
                            });

                            setTimeout(() => {
                                luckyMap.set(d.member.user.id, {
                                    used: false, 
                                    started: null,
                                    finishes: null
                                });
                            }, 7200000);

                            return
                        }
                    }, 8000)
                }
            }
        }

        if (d.type === 5) {
            if (d.data.custom_id.startsWith("cbmodal_")) {
                const snowflakeId = d.data.custom_id.substring(8, d.data.custom_id.length);
                console.log(snowflakeId)
                const guess = d.data.components[0].components[0].value.toLowerCase().replace(" ", "").replace("'", "").replace(".", "");
                var matches = false;

                // if (d.member.user.id === "626928937355706373") return IntReply(d, { content: `<@${d.member.user.id}>, ` + "No puedes atrapar countryballs ya que eres el dueño y te sabes todas.\nDeja de los demás tambien atrapen, mejor tu PONTE A PROGRAMARME Y DEJA DE ANDAR ELIMINANDOME ARCHIVOS ctm." })

                const cbData = spawns.get(snowflakeId + ".data");
                if (!cbData) return IntReply(d, { content: `<@${d.member.user.id}>, este countryball expiró.` });

                if (cbData.names.includes(guess)) matches = true;

                if (spawns.get(snowflakeId + ".catched")) return IntReply(d, { content: `<@${d.member.user.id}>, ya fui atrapado.` });

                if (matches) {
                    IntReply(d, { content: `<@${d.member.user.id}>, ¡atrapaste a **${cbData.renderedName}**!` });
                    spawns.set(snowflakeId + ".catched", true)

                    APIRequest(`/channels/${d.channel_id}/messages/${spawns.get(snowflakeId + ".message.id")}`, {
                        method: "PATCH",
                        body: {
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
                        }
                    })

                    if (!owns.has(d.member.user.id)) owns.set(d.member.user.id, []);

                    const randomPercentage1 = Math.floor(Math.random() * (20 - -20) + -20);
                    const randomPercentage2 = Math.floor(Math.random() * (20 - -20) + -20);

                    const calculatedHp = Math.floor(randomPercentage1 > 0 ? (cbData.defaultHp * (randomPercentage1 / 100 + 1)) : (cbData.defaultHp - (cbData.defaultHp * (Math.abs(randomPercentage1)) / 100)));
                    const calculatedAtk = Math.floor(randomPercentage2 > 0 ? (cbData.defaultAtk * (randomPercentage2 / 100 + 1)) : (cbData.defaultAtk - (cbData.defaultAtk * (Math.abs(randomPercentage2)) / 100)));

                    console.log(calculatedAtk, calculatedHp)

                    owns.union(d.member.user.id, {
                        data: cbData,
                        id: snowflakeId,
                        catchDate: Math.floor(Date.now() / 1000),
                        percentages: [randomPercentage1, randomPercentage2],
                        hp: calculatedHp,
                        atk: calculatedAtk
                    });
                } else return IntReply(d, { content: `<@${d.member.user.id}>, nombre incorrecto.` });
            }
        }

        if (d.type == 4) {
            if (d.data.options[0].options[0].name == "countryball") {
                if (!owns.has(d.member.user.id)) return APIRequest(`/interactions/${d.id}/${d.token}/callback`, {
                    method: "POST",
                    body: {
                        type: 8,
                        data: { choices: [] }
                    }
                })
    
                const query = d.data.options[0].options[0].value;
                var cbArray = []
    
                if (query.length == 0) {
                    owns.get(d.member.user.id)
                    .forEach(cbObject => {
                        if (cbArray.length > 24) return;
                        if (cbObject.hasOwnProperty("favorite")) return cbArray.unshift({ name: ` ♥ ${cbObject.data.renderedName} HP:${cbObject.percentages[0] > 0 ? `+${cbObject.percentages[0]}%` : `${cbObject.percentages[0]}%`} ATK:${cbObject.percentages[1] > 0 ? `+${cbObject.percentages[1]}%` : `${cbObject.percentages[1]}%`}`, value: cbObject.id })
                        cbArray.push({ name: `${cbObject.data.renderedName} HP:${cbObject.percentages[0] > 0 ? `+${cbObject.percentages[0]}%` : `${cbObject.percentages[0]}%`} ATK:${cbObject.percentages[1] > 0 ? `+${cbObject.percentages[1]}%` : `${cbObject.percentages[1]}%`}`, value: cbObject.id });
                    })
                        
                    return APIRequest(`/interactions/${d.id}/${d.token}/callback`, {
                        method: "POST",
                        body: {
                            type: 8,
                            data: { choices: cbArray }
                        }
                    })
                }
    
                owns.get(d.member.user.id)
                .forEach(cbObject => {
                    if (cbArray.length > 24) return;
                    if (cbObject.data.names[0].startsWith(query.toLowerCase().replace(" ", "").replace("'", "").replace(".", ""))) {
                        if (cbObject.hasOwnProperty("favorite") && cbObject["favorite"]) return cbArray.unshift({ name: ` ♥ ${cbObject.data.renderedName} HP:${cbObject.percentages[0] > 0 ? `+${cbObject.percentages[0]}%` : `${cbObject.percentages[0]}%`} ATK:${cbObject.percentages[1] > 0 ? `+${cbObject.percentages[1]}%` : `${cbObject.percentages[1]}%`}`, value: cbObject.id })
                        cbArray.push({ name: `${cbObject.data.renderedName} HP:${cbObject.percentages[0] > 0 ? `+${cbObject.percentages[0]}%` : `${cbObject.percentages[0]}%`} ATK:${cbObject.percentages[1] > 0 ? `+${cbObject.percentages[1]}%` : `${cbObject.percentages[1]}%`}`, value: cbObject.id })
                    }
                    else return;
                })
    
                return APIRequest(`/interactions/${d.id}/${d.token}/callback`, {
                    method: "POST",
                    body: {
                        type: 8,
                        data: { choices: cbArray }
                    }
                })
            }
        }

        if (d.type === 2) {
            const cmd = ws.commands.get(d.data.name);
            if (!cmd) return

            try {
                cmd.runSlash(ws, d)
            } catch (error) {
                EphemeralReply(d, { embeds: [{
                    color: 0xcc0000,
                    author: { name: "CountryBot", icon_url: ws.avatarURL },
                    footer: { text: `Solicitado por ${d.member.user.username}`, icon_url: ws.getAvatarURL(d.member.user) },
                    description: ":exclamation: Hubo un error al intentar ejecutar el comando.\nSi el error persiste, contáctate con el desarrollador.",
                    image: { url: "https://cdn.discordapp.com/attachments/1091932806206201857/1096993927376158801/66_sin_titulo_20230415220156.png" }
                }] });

                console.warn(error)
            }
        }
    }
}

function getDominantColor(dominantColor) {
    if (dominantColor === "IMG_DOMINANT_COLOR_UNDEFINED") return 0x2b7fdf
    else if (dominantColor === "BLACK") return 0x000000
    else if (dominantColor === "BLUE") return 0x0000FF
    else if (dominantColor === "BROWN") return 0x964B00
    else if (dominantColor === "GRAY") return 0x808080
    else if (dominantColor === "GREEN") return 0x00FF00
    else if (dominantColor === "ORANGE") return 0xFFA500
    else if (dominantColor === "PINK") return 0xFFC0CB
    else if (dominantColor === "PURPLE") return 0xA020F0
    else if (dominantColor === "RED") return 0xFFA500
    else if (dominantColor === "TEAL") return 0x008080
    else if (dominantColor === "WHITE") return 0xFFFFFF
    else if (dominantColor === "YELLOW") return 0xFFFF00
    else return undefined;
}