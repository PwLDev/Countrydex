import { SpawnRandomCountryball } from "../utils/Countrydex.js";
import { GetChannel } from "../utils/Get.js";
import { Reply } from "../utils/Message.js";
import Store from "data-store";
import path from "node:path";
import { triggers, countrydexConfig } from "./Ready.js";

// var countrydexConfig = new Store({ path: path.join(process.cwd() + "/countrydex/config.json"), debounce: 0 });

const prefix = "c!";

export default {
    name: "MESSAGE_CREATE",
    run: async (ws, message) => {
        if (message.author.bot) return;
        // console.log(`Mensaje enviado en el servidor: ${ws.guildMap.get(message.guild_id).name}\nDice: ${message.content}\nEnviado en el canal con ID: ${message.channel_id}`)\
        if (countrydexConfig.has(message.guild_id) && message.channel_id === countrydexConfig.get(message.guild_id + ".channel") && triggers.get(message.guild_id) == true) {
            triggers.set(message.guild_id, false)
            setTimeout(() => {
                SpawnRandomCountryball(countrydexConfig.get(message.guild_id + ".channel"));
            }, 5000)
        }
        if (!message.guild_id && message.content.toLowerCase().replace(" ", "").startsWith(prefix)) return Reply(message, { content: "Lo siento, no puedes usarme en DM.\nSi deseas añadirme a un servidor, da clic en mi perfil y pulsa Añadir a servidor." })
        if (!message.content.toLowerCase().replace(" ", "").startsWith(prefix)) return;

        const args = message.content.slice(prefix.length).trim().split(/ +/g);
        const command = args.shift().toLowerCase();

        const cmd = ws.commands.get(command) || ws.commands.find(cmd => cmd.alias && cmd.alias.includes(command));
        if (!cmd) return;

        try {
            cmd.run(ws, message, args);
        } catch (error) {
            Reply(message, { embeds: [{
                color: 0xcc0000,
                author: { name: "CountryBot", icon_url: ws.avatarURL },
                footer: { text: `Solicitado por ${message.author.username}`, icon_url: ws.getAvatarURL(message.author) },
                description: ":exclamation: Hubo un error al intentar ejecutar el comando.\nSi el error persiste, contáctate con el desarrollador.",
                image: { url: "https://cdn.discordapp.com/attachments/1091932806206201857/1096993927376158801/66_sin_titulo_20230415220156.png" }
            }] });

            console.warn(error);
        }
    }
}