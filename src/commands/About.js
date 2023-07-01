import { Reply } from "../utils/Message.js";
import { IntReply as InteractionReply } from "../utils/Interactions.js";
import fs from "fs";
import path from "path";

export default {
    name: "about",
    data: {
        type: 1,
        name: "about",
        description: "Descubre más información sobre el bot."
    },
    run: (ws, message) => {
        const DataConfig = JSON.parse(fs.readFileSync(path.resolve("../data/config.json"), { encoding: "utf-8" }));
        Reply(message, { embeds: [{
            color: 0x2b7fdf,
            author: { name: DataConfig["dexName"], icon_url: ws.avatarURL },
            title: "Información",
            description: `**Versión del bot**: 0.7.2\n\nCreado por [PwL](https://github.com/PwLDev). Para la comunidad hispana de Countryballs.\nMuchísimas gracias a Alen't por los excelentes dibujos.`,
            footer: { text: `Solicitado por ${message.author.username}`, icon_url: ws.getAvatarURL(message.author) },
            thumbnail: { url: ws.avatarURL }
        }] })
    },
    runSlash: (ws, interaction) => {
        const DataConfig = JSON.parse(fs.readFileSync(path.resolve("../data/config.json"), { encoding: "utf-8" }));
        InteractionReply(interaction, { embeds: [{
            color: 0x2b7fdf,
            author: { name: DataConfig["dexName"], icon_url: ws.avatarURL },
            title: "Información",
            description: `**Versión del bot**: 0.7.2\n\nCreado por [PwL](https://github.com/PwLDev). Para la comunidad hispana de Countryballs.\nMuchísimas gracias a Alen't por los excelentes dibujos.\n\nEste bot actualmente se encuentra en desarrollo, por lo que puede contener bugs`,
            footer: { text: `Solicitado por ${interaction.member.user.username}`, icon_url: ws.getAvatarURL(interaction.member.user) },
            thumbnail: { url: ws.avatarURL }
        }] })
    }
}