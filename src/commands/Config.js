import { count } from "node:console";
import { HasPermission } from "../utils/Get.js"
import { IntReply } from "../utils/Interactions.js";
import { Reply } from "../utils/Message.js"
import Store from "data-store";
import path from "node:path";

// var countrydexConfig = new Store({ path: path.join(process.cwd() + "/countrydex/config.json"), debounce: 0 });
import { triggers, countrydexConfig } from "../events/Ready.js";
import { intervalMap } from "../events/GuildCreate.js";

const DataConfig = JSON.parse(fs.readFileSync(path.resolve("../data/config.json"), { encoding: "utf-8" }));

export default {
    name: "config",
    alias: ["configurar", "configuracion"],
    data: {
        type: 1,
        name: "config",
        description: "Administra la configuración de " + DataConfig["dexName"],
        default_member_permissions: (1 << 5).toString(),
        dm_permission: false,
        options: [{
            type: 1,
            name: "prefix",
            description: "Cambiar el prefijo de mensajes.",
            options: [{
                type: 3,
                name: "prefix",
                description: "Prefijo a cambiar",
                required: true
            }],
        }, {
            type: 2,
            name: "countrydex",
            description: `Configura ${DataConfig["dexName"]} en tu servidor.`,
            options: [{
                type: 1,
                name: "disable",
                description: `Desconfigurar ${DataConfig["dexName"]}.`
            }, {
                type: 1,
                name: "enable",
                description: `Configurar ${DataConfig["dexName"]}.`,
                options: [{
                    type: 7,
                    name: "channel",
                    description: `Canal donde aparecerán ${DataConfig["countryballsName"]}s.`,
                    required: true
                }, {
                    type: 4,
                    name: "interval",
                    description: "Establecer intervalo de aparición. (Por defecto: 10, Máximo: 1440, Mínimo: 1)",
                    required: false
                }]
            }]
        }],
    },
    run: async(ws, message, args) => {
        const DataConfig = JSON.parse(fs.readFileSync(path.resolve("../data/config.json"), { encoding: "utf-8" }));
        return Reply(message, { embeds: [{
            color: 0xcc0000,
            author: { name: DataConfig["dexName"], icon_url: ws.avatarURL },
            footer: { text: `Solicitado por ${message.author.username}`, icon_url: ws.getAvatarURL(message.author) },
            description: ":x: Lo siento, este comando no puede ser utilizado en comando de mensaje."
        }] });
    },
    runSlash: (ws, interaction) => {
        const option = interaction.data.options[0].name;
        const DataConfig = JSON.parse(fs.readFileSync(path.resolve("../data/config.json"), { encoding: "utf-8" }));

        if (option === DataConfig["dexName"]) {
            console.log(interaction.data.options[0].options)
            if (interaction.data.options[0].options[0].type == 1 && interaction.data.options[0].options[0].name === "disable") {
                if (countrydexConfig.has(interaction.guild_id)) countrydexConfig.del(interaction.guild_id);

                clearInterval(intervalMap.get(interaction.guild_id))
                intervalMap.delete(interaction.guild_id);

                return IntReply(interaction, { embeds: [{
                    color: 0x2b7fdf,
                    author: { name: DataConfig["dexName"], icon_url: ws.avatarURL },
                    title: `**✅ ${DataConfig["dexName"]} Desactivado**`,
                    description: `Gracias por usar ${DataConfig["dexName"]}`,
                    footer: { text: `Solicitado por ${interaction.member.user.username}`, icon_url: ws.getAvatarURL(interaction.member.user) }
                }] });
            }

            const channel = interaction.data.options[0].options[0].options[0].value;
            const interval = interaction.data.options[0].options[0].options.length == 2 ? interaction.data.options[0].options[0].options[1].value : 10;

            if (interval > 1440 || interval < 1) return IntReply(interaction, { embeds: [{
                color: 0xcc0000,
                author: { name: DataConfig["dexName"], icon_url: ws.avatarURL },
                footer: { text: `Solicitado por ${interaction.member.user.username}`, icon_url: ws.getAvatarURL(interaction.member.user) },
                description: ":x: No se puede establecer el intervalo fuera del rango permitido.\nMáximo: 1440. Mínimo: 1"
            }] });

            countrydexConfig.set(interaction.guild_id, {
                channel: channel,
                interval: interval,
            });
            countrydexConfig.save();
            countrydexConfig.load();

            triggers.set(interaction.guild_id, false)

            const interv = setInterval(() => triggers.set(interaction.guild_id, true), (interval * 60000));
            intervalMap.set(interaction.guild_id, interv)

            return IntReply(interaction, { embeds: [{
                color: 0x2b7fdf,
                author: { name: DataConfig["dexName"], icon_url: ws.avatarURL },
                title: `**✅ ${DataConfig["dexName"]} Activado**`,
                description: `${DataConfig["dexName"]} ha sido activado exitosamente, los countryballs aparecerán en <#${channel}> cada ${interval} minuto(s).\nLos countryballs aparecerán de manera aleatoria en ese intervalo mientras el bot esté en linea y haya actividad en el canal.`,
                footer: { text: `Solicitado por ${interaction.member.user.username}`, icon_url: ws.getAvatarURL(interaction.member.user) }
            }] });
        }
    }
}