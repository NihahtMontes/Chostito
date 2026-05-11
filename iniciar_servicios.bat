@echo off
echo ========================================================
echo INICIANDO CHOSTITO BACKEND Y MOVIL
echo ========================================================

cd /d "%~dp0"

IF NOT EXIST "mobile\" (
    echo [1/3] No se encontro la carpeta "mobile". Creando proyecto React Native...
    echo Esto puede tardar un par de minutos, por favor espera...
    call npx create-expo-app@latest mobile --template blank
    
    echo.
    echo Instalando dependencias de navegacion, camara y HTTP...
    cd mobile
    call npm install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs react-native-screens react-native-safe-area-context axios
    call npx expo install expo-secure-store expo-camera expo-image react-native-svg react-native-qrcode-svg
    cd ..
    echo [EXITO] Proyecto movil creado y configurado.
) ELSE (
    echo [1/3] Proyecto movil ya existe. Omitiendo instalacion.
)

echo.
:: 2. DETECTAR IP Y CONFIGURAR VARIABLES DE ENTORNO
echo [2/3] Detectando IP de la red para conectar el celular...
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
    set LOCAL_IP=%%a
    goto :found_ip
)
:found_ip
set LOCAL_IP=%LOCAL_IP: =%
echo IP detectada: %LOCAL_IP%
echo EXPO_PUBLIC_API_URL=http://%LOCAL_IP%:5027/api > mobile\.env

echo.
:: 3. LEVANTAR EL BACKEND PERMITIENDO CONEXIONES EXTERNAS
echo [3/4] Levantando la API Backend en nueva ventana...
start "Backend - Chostito" cmd /k "cd backend && dotnet run --urls http://0.0.0.0:5027"

echo.
:: 4. LEVANTAR EL FRONTEND MÓVIL
echo [4/4] Levantando la app Movil (Expo)...
start "Mobile - Chostito" cmd /k "cd mobile && npx expo start -c"

echo.
echo ========================================================
echo Todo ha sido lanzado en ventanas separadas.
echo Ya puedes cerrar esta ventana.
echo ========================================================
pause
