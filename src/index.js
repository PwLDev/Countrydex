import { createInterface } from "readline";
import fs from "fs";
import path from "path";
import { Store } from "data-store";
import { initServer } from "./server.js";

const readline = createInterface({
    input: process.stdin,
    output: process.stdout
});

if (!fs.existsSync(path.resolve("../data/config.json"))) {
    var port = 0;
    readline.question("¿En qué puerto deseas establecer el panel? Si no deseas establecer uno, presiona enter sin escribir nada.\nPuerto: ", answer => {
        if (answer.length < 1) {
            port = 3000
            fs.writeFileSync(path.resolve("../data/config.json"), JSON.stringify({ setup: true, port: port }, null, 2), { encoding: "utf-8" });
            console.info("¡Porceso de configuración terminado! Vuelve a ejecutar el archivo para continuar.\nPuerto seleccionado: ", port);
            setTimeout(() => process.exit(0), 5000);
        }
        else if (isNaN(parseInt(answer))) {
            console.error(`Lo siento, "${answer}" no es un número válido. Vuelve a ejecutar este archivo para corregirlo.\nCerrando automáticamente...`);
            setTimeout(() => process.exit(1), 3000);
        } else if (parseInt(answer) < 1023 || parseInt(answer) > 65535) {
            console.error(`Lo siento, "${answer}" no es un número válido para un puerto. Vuelve a ejecutar este archivo para corregirlo.\nCerrando automáticamente...`);
            setTimeout(() => process.exit(1), 3000);
        } else {
            port = parseInt(answer)
            fs.writeFileSync(path.resolve("../data/config.json"), JSON.stringify({ setup: false, port: port }, null, 2), { encoding: "utf-8" });
            console.info("¡Porceso de configuración terminado! Vuelve a ejecutar el archivo para continuar.\nPuerto seleccionado: ", port);
            setTimeout(() => process.exit(0), 5000);
        }
    })
} else {
    var getPort = fs.readFileSync(path.resolve("../data/config.json"), { encoding: "utf-8" });
    initServer(JSON.parse(getPort).port);
}