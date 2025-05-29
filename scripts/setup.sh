#!/bin/bash

echo "🚀 Configurando Financial Resume Engine Frontend..."

# Verificar que Node.js esté instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado. Por favor instala Node.js 16 o superior."
    exit 1
fi

# Verificar versión de Node.js
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ Se requiere Node.js 16 o superior. Versión actual: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detectado"

# Instalar dependencias
echo "📦 Instalando dependencias..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Error al instalar dependencias"
    exit 1
fi

echo "✅ Dependencias instaladas correctamente"

# Crear archivo .env si no existe
if [ ! -f .env ]; then
    echo "📝 Creando archivo .env..."
    cat > .env << EOL
# URL del backend API
REACT_APP_API_URL=http://localhost:8080/api/v1

# Configuración de desarrollo
REACT_APP_ENV=development
EOL
    echo "✅ Archivo .env creado"
else
    echo "ℹ️  Archivo .env ya existe"
fi

# Crear directorio public si no existe
if [ ! -d "public" ]; then
    mkdir -p public
    echo "📁 Directorio public creado"
fi

# Crear favicon básico si no existe
if [ ! -f "public/favicon.ico" ]; then
    echo "🎨 Creando favicon básico..."
    # Crear un favicon simple (esto es solo un placeholder)
    touch public/favicon.ico
fi

# Crear manifest.json si no existe
if [ ! -f "public/manifest.json" ]; then
    echo "📱 Creando manifest.json..."
    cat > public/manifest.json << EOL
{
  "short_name": "FinanceApp",
  "name": "Financial Resume Engine",
  "icons": [
    {
      "src": "favicon.ico",
      "sizes": "64x64 32x32 24x24 16x16",
      "type": "image/x-icon"
    }
  ],
  "start_url": ".",
  "display": "standalone",
  "theme_color": "#009ee3",
  "background_color": "#ffffff"
}
EOL
    echo "✅ Manifest.json creado"
fi

echo ""
echo "🎉 ¡Configuración completada!"
echo ""
echo "Para iniciar el servidor de desarrollo:"
echo "  npm start"
echo ""
echo "Para construir para producción:"
echo "  npm run build"
echo ""
echo "La aplicación estará disponible en: http://localhost:3000"
echo "Asegúrate de que el backend esté ejecutándose en: http://localhost:8080"
echo "" 