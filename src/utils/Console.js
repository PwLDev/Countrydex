export function WebConsoleLog(socket, text) {
    socket.emit("console_log", text)
}