stty -echoctl

PROMPT_COMMAND=
echo "\033]0;Instalador de Paquetes\a"

reset

echo "Bienvenido al Instalador de Paquetes"
echo "Esto te ayudara a instalar todo lo necesario para iniciar el bot."
echo "Es normal que la ventana automaticamente se cierre al terminar."
echo "Hecho por PwLDev"
ABSPATH=$(cd "$(dirname "$0")"; pwd -P)

read -n 1 -s -r -p "Presiona cualquier tecla para continuar..."

reset

cd "${ABSPATH}/src"
npm i