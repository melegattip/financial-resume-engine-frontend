# 🔧 Guía de Troubleshooting - Frontend Deployment

## 🚨 Problemas Comunes y Soluciones

### 1. ❌ Error de CORS
**Síntomas:**
```
Access to XMLHttpRequest at 'https://backend-url' from origin 'https://frontend-url' has been blocked by CORS policy
```

**✅ Solución:**
1. Verificar que la URL del frontend esté en la lista de orígenes permitidos del backend
2. Asegurar que el backend esté configurado con `GIN_MODE=release`
3. Verificar que las URLs sean exactamente las mismas (con/sin trailing slash)

**URLs que deben estar en CORS (backend):**
- `https://financial-resume-frontend-ncf3kbolwa-rj.a.run.app`
- `https://stable---financial-resume-frontend-ncf3kbolwa-rj.a.run.app`

### 2. ❌ Error de Conexión API
**Síntomas:**
```
Network Error
Request failed with status code 404
```

**✅ Solución:**
1. Verificar que la URL del backend esté correcta en el frontend
2. Usar la URL estable del backend: `https://stable---financial-resume-engine-ncf3kbolwa-rj.a.run.app/api/v1`
3. Verificar que el backend esté desplegado y funcionando

### 3. ❌ Error de Build del Frontend
**Síntomas:**
```
npm ERR! code ELIFECYCLE
npm ERR! errno 1
```

**✅ Solución:**
1. Limpiar cache de npm: `npm cache clean --force`
2. Reinstalar dependencias: `rm -rf node_modules && npm install`
3. Verificar que Node.js sea versión 16 o superior

### 4. ❌ Error de Autenticación GCP
**Síntomas:**
```
ERROR: (gcloud.auth.configure-docker) Your credentials are invalid
```

**✅ Solución:**
1. Autenticarse nuevamente: `gcloud auth login`
2. Configurar proyecto: `gcloud config set project financial-resume-prod-464920`
3. Verificar permisos: `gcloud auth list`

### 5. ❌ Error de Container Startup
**Síntomas:**
```
The user-provided container failed to start and listen on the port defined by the PORT environment variable
```

**✅ Solución:**
1. Verificar que nginx esté configurado para escuchar en el puerto correcto (8080)
2. Verificar que el script `start.sh` esté funcionando correctamente
3. Revisar logs: `gcloud run logs read financial-resume-frontend --region southamerica-east1`

## 🛠️ Comandos de Diagnóstico

### Verificar Estado del Servicio
```bash
gcloud run services describe financial-resume-frontend --region southamerica-east1
```

### Ver Logs en Tiempo Real
```bash
gcloud run logs tail financial-resume-frontend --region southamerica-east1
```

### Probar Conectividad
```bash
curl -I https://financial-resume-frontend-ncf3kbolwa-rj.a.run.app
curl -I https://stable---financial-resume-engine-ncf3kbolwa-rj.a.run.app/health
```

### Verificar Variables de Entorno
```bash
gcloud run services describe financial-resume-frontend --region southamerica-east1 --format="value(spec.template.spec.template.spec.containers[0].env[].name,spec.template.spec.template.spec.containers[0].env[].value)"
```

## 🔄 Proceso de Deployment Paso a Paso

### 1. Pre-requisitos
- [x] Autenticación GCP configurada
- [x] Docker instalado y funcionando
- [x] Node.js 16+ instalado
- [x] Backend desplegado y funcionando

### 2. Configuración
```bash
# Navegar al directorio del frontend
cd financial-resume-engine-frontend

# Verificar configuración
cat env.production
```

### 3. Deployment
```bash
# Ejecutar script de deployment
./deploy-frontend.sh
```

### 4. Verificación
```bash
# Probar frontend
curl -I https://financial-resume-frontend-ncf3kbolwa-rj.a.run.app

# Probar conexión con backend
curl -I https://stable---financial-resume-engine-ncf3kbolwa-rj.a.run.app/health
```

## 📋 Checklist de Verificación

### ✅ Antes del Deployment
- [ ] Backend desplegado y funcionando
- [ ] URLs del backend actualizadas en el frontend
- [ ] CORS configurado correctamente en el backend
- [ ] Autenticación GCP configurada
- [ ] Docker funcionando

### ✅ Durante el Deployment
- [ ] Build de Docker exitoso
- [ ] Push a GCR exitoso
- [ ] Deployment a Cloud Run exitoso
- [ ] Health check pasando

### ✅ Después del Deployment
- [ ] Frontend carga correctamente
- [ ] Conexión con backend funcionando
- [ ] Login/registro funcionando
- [ ] APIs respondiendo correctamente

## 🆘 Contacto de Soporte

Si los problemas persisten:
1. Revisar logs detallados
2. Verificar configuración de red
3. Consultar documentación de GCP Cloud Run
4. Contactar al equipo de desarrollo

---

**Última actualización:** $(date)
**Versión:** 1.0 