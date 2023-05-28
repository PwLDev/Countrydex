@echo off
title Panel de CountryBot
echo Bienvenido al panel de Countrybot
echo AVISO: Para mantener el bot encendido, no cierres esta ventana. Para apagarlo, cierra la ventana.
echo Si tienes otra ventana abierta del mismo bot, cierrala.
echo Hecho por PwLDev
echo NOTA: Este panel al detectar un error mostrara el error. Por lo tanto no se cerrara automaticamente.
pause /k
cls
cd src && node .
title Panel de CountryBot
cmd /k