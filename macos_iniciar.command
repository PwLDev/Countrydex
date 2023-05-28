stty -echoctl
PROMPT_COMMAND=
echo "\033]0;Panel de CountryBot\a"

reset

echo "Bienvenido al panel de Countrybot"
echo "AVISO: Para mantener el bot encendido, no cierres esta ventana. Para apagarlo, cierra la ventana."
echo "Si tienes otra ventana abierta del mismo bot, cierrala."
echo "Hecho por PwLDev"
ABSPATH=$(cd "$(dirname "$0")"; pwd -P)

read -n 1 -s -r -p "Presiona cualquier tecla para continuar..."

reset

cd "${ABSPATH}/src"
node .