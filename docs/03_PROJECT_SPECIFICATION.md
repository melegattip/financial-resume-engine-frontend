# PROJECT SPECIFICATION - Financial Resume Engine Frontend

## 📋 INFORMACIÓN GENERAL DEL PROYECTO

### Nombre del Proyecto
**Financial Resume Engine - Frontend**

### Descripción
Aplicación web moderna para gestión financiera personal desarrollada con React, con un diseño limpio y profesional. Permite a los usuarios gestionar gastos, ingresos, categorías y generar reportes financieros con análisis avanzado.

### Versión Actual
**v1.0.0**

### Estado del Proyecto
🟡 **EN DESARROLLO ACTIVO** - Frontend completamente funcional, backend en transición a nuevos endpoints analíticos

---

## 🎯 CONTEXTO DE NEGOCIO Y PRODUCTO

### Propósito del Negocio
Ofrecer una herramienta de gestión financiera personal que permita a usuarios individuales:
- Controlar sus gastos e ingresos mensualmente
- Analizar patrones de gasto por categorías
- Generar reportes financieros detallados
- Mantener un balance actualizado de sus finanzas
- Identificar oportunidades de ahorro y optimización

### Usuarios Objetivo
- **Primario**: Personas que buscan control detallado de sus finanzas personales
- **Secundario**: Freelancers y trabajadores independientes que necesitan tracking básico
- **Perfil**: Usuarios con conocimientos básicos de tecnología, edad 25-45 años

### Propuesta de Valor
1. **Simplicidad**: Interfaz intuitiva y fácil de usar
2. **Análisis Automático**: Cálculos de porcentajes y tendencias automatizados
3. **Visualización**: Gráficos y dashboards interactivos
4. **Categorización**: Organización inteligente de transacciones
5. **Tiempo Real**: Actualización instantánea de métricas

---

## 🏗️ ARQUITECTURA TÉCNICA

### Arquitectura General
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   FRONTEND      │    │    BACKEND      │    │   DATABASE      │
│   React SPA     │◄──►│   Go Clean      │◄──►│   MySQL/SQLite  │
│   Port: 3000    │    │   Port: 8080    │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Patrón Arquitectónico Frontend
- **SPA (Single Page Application)** con React Router
- **Component-Based Architecture** con componentes reutilizables
- **Service Layer Pattern** para comunicación con API
- **State Management** con React Hooks (useState, useEffect)
- **Responsive Design** con Tailwind CSS

### Patrón Arquitectónico Backend
- **Clean Architecture** con separación por capas
- **Dependency Injection** para servicios
- **Repository Pattern** para acceso a datos
- **Use Cases** para lógica de negocio
- **HTTP Adapters** para endpoints REST

### Comunicación Frontend-Backend
- **Protocol**: HTTP/REST
- **Authentication**: Header `x-caller-id` (temporal, usuario mock)
- **Data Format**: JSON
- **Error Handling**: Interceptores Axios con notificaciones toast

---

## 💻 STACK TECNOLÓGICO

### Frontend Stack
```json
{
  "framework": "React 18.2.0",
  "routing": "React Router DOM 6.8.1",
  "styling": "Tailwind CSS 3.2.7",
  "charts": "Recharts 2.5.0",
  "http_client": "Axios 1.3.4",
  "forms": "React Hook Form 7.43.5",
  "notifications": "React Hot Toast 2.4.0",
  "icons": "Lucide React 0.321.0",
  "dates": "date-fns 2.29.3",
  "utilities": "clsx 1.2.1"
}
```

### Backend Stack (Referencia)
```json
{
  "language": "Go",
  "framework": "Gin/Gorilla Mux",
  "database": "MySQL/SQLite",
  "architecture": "Clean Architecture",
  "documentation": "Swagger/OpenAPI"
}
```

### Herramientas de Desarrollo
- **Node.js**: Entorno de ejecución
- **npm**: Gestor de paquetes
- **Create React App**: Configuración base
- **PostCSS**: Procesamiento CSS
- **ESLint**: Linting de código

---

## 🎨 SISTEMA DE DISEÑO

### Paleta de Colores
```css
/* Colores Primarios */
--primary: #009ee3;         /* Azul principal */
--secondary: #00a650;       /* Verde secundario */
--accent: #ff6900;          /* Naranja de acento */

/* Estados */
--success: #00a650;         /* Verde éxito */
--warning: #ff6900;         /* Naranja advertencia */
--error: #e53e3e;           /* Rojo error */

/* Escala de Grises */
--gray-50: #f9fafb;
--gray-100: #f3f4f6;
--gray-200: #e5e7eb;
--gray-500: #6b7280;
--gray-900: #111827;
```

### Tipografía
- **Fuente Principal**: Inter
- **Fuente Fallback**: Proxima Nova, system-ui, sans-serif
- **Jerarquía**: Títulos (xl-2xl), Subtítulos (lg), Cuerpo (base), Small (sm-xs)

### Componentes de Diseño
- **Border Radius**: 8px estándar, 12px para elementos grandes
- **Shadows**: Suaves con opacidad baja (0.1-0.15)
- **Espaciado**: Múltiplos de 4px (Tailwind spacing)
- **Animaciones**: Transiciones suaves (0.3s ease-in-out)

---

## 🔧 FUNCIONALIDADES ACTUALES

### 1. Dashboard Principal
**Ubicación**: `src/pages/Dashboard.jsx`
**Funcionalidades**:
- Métricas principales (ingresos, gastos, balance)
- Toggle para ocultar/mostrar montos
- Filtros por mes y año
- Gráficos de tendencias (área y pie)
- Lista de transacciones recientes
- Cálculo automático de porcentajes

**Componentes**:
- Cards de métricas con iconos
- Selector de período
- Gráficos responsivos (Recharts)
- Tabla de transacciones con ordenamiento

### 2. Gestión de Gastos
**Ubicación**: `src/pages/Expenses.jsx`
**Funcionalidades**:
- CRUD completo de gastos
- Estados: pagado/pendiente
- Fechas de vencimiento
- Asociación con categorías
- Filtros y búsqueda
- Cálculo de porcentajes respecto a ingresos

### 3. Gestión de Ingresos
**Ubicación**: `src/pages/Incomes.jsx`
**Funcionalidades**:
- CRUD completo de ingresos
- Categorización de ingresos
- Actualización automática de porcentajes de gastos
- Búsqueda y filtros

### 4. Gestión de Categorías
**Ubicación**: `src/pages/Categories.jsx`
**Funcionalidades**:
- Crear y editar categorías
- Vista en tarjetas organizadas
- Descripciones personalizadas
- Colores automáticos por ID

### 5. Reportes Avanzados
**Ubicación**: `src/pages/Reports.jsx`
**Funcionalidades**:
- Filtros por rango de fechas
- Gráficos de tendencias y distribución
- Tabla detallada por categorías
- Métricas consolidadas
- Preparado para exportación (futuro)

### 6. Configuración
**Ubicación**: `src/pages/Settings.jsx`
**Funcionalidades**:
- Perfil de usuario
- Preferencias de aplicación
- Configuración de notificaciones
- Opciones de exportación

---

## 🚀 ESTRUCTURA DEL PROYECTO

```
financial-resume-engine-frontend/
├── docs/                          # Documentación del proyecto
│   ├── 01_BACKEND_IMPLEMENTATION_RESPONSE.md
│   ├── 02_BACKEND_REFACTORING_BRIEF.md
│   └── 03_PROJECT_SPECIFICATION.md
├── public/                        # Archivos estáticos
├── src/                          # Código fuente
│   ├── components/               # Componentes reutilizables
│   │   └── Layout/
│   │       ├── Sidebar.jsx      # Navegación lateral
│   │       └── Header.jsx       # Cabecera de aplicación
│   │   ├── pages/                   # Páginas principales
│   │   │   ├── Dashboard.jsx        # Dashboard principal
│   │   │   ├── Expenses.jsx         # Gestión de gastos
│   │   │   ├── Incomes.jsx          # Gestión de ingresos
│   │   │   ├── Categories.jsx       # Gestión de categorías
│   │   │   ├── Reports.jsx          # Reportes y análisis
│   │   │   └── Settings.jsx         # Configuración
│   │   ├── services/                # Servicios y API
│   │   │   └── api.js              # Cliente HTTP y endpoints
│   │   ├── App.jsx                 # Componente raíz
│   │   ├── index.js               # Punto de entrada
│   │   └── index.css              # Estilos globales
│   ├── package.json               # Dependencias y scripts
│   ├── tailwind.config.js        # Configuración de Tailwind
│   └── README.md                 # Documentación principal
```

---

## 🔄 ESTADO ACTUAL Y TRANSICIÓN

### Frontend Status: ✅ COMPLETO
- **Dashboard**: Totalmente funcional con fallbacks inteligentes
- **CRUD Operations**: Todas las operaciones funcionando
- **UI/UX**: Diseño completo y responsive
- **Error Handling**: Manejo robusto de errores
- **Performance**: Optimizado para cargas rápidas

### Backend Status: 🟡 EN TRANSICIÓN
**Endpoints Legacy (Funcionando)**:
- `GET /api/v1/expenses` ✅
- `GET /api/v1/incomes` ✅  
- `GET /api/v1/categories` ✅
- CRUD completo para todas las entidades ✅

**Endpoints Analíticos (En Desarrollo)**:
- `GET /api/v1/dashboard` ⚠️ Implementado pero en testing
- `GET /api/v1/expenses/summary` ⚠️ Implementado pero en testing
- `GET /api/v1/categories/analytics` ⚠️ Implementado pero en testing
- `GET /api/v1/incomes/summary` ⚠️ Implementado pero en testing

### Estrategia de Fallback
El frontend implementa un sistema inteligente:
```javascript
try {
  // Intentar nuevos endpoints con datos pre-calculados
  const dashboard = await dashboardAPI.overview(params);
  // Usar datos del backend
} catch (error) {
  // Fallback a endpoints legacy con cálculos client-side
  const [expenses, incomes] = await Promise.all([
    expensesAPI.list(),
    incomesAPI.list()
  ]);
  // Calcular métricas en frontend
}
```

---

## 📊 PATRONES Y DECISIONES TÉCNICAS

### Patrones de Comunicación API
```javascript
// Estructura estándar de servicios
export const entityAPI = {
  list: () => api.get('/entities'),
  get: (id) => api.get(`/entities/${id}`),
  create: (data) => api.post('/entities', data),
  update: (id, data) => api.patch(`/entities/${id}`, data),
  delete: (id) => api.delete(`/entities/${id}`)
};
```

### Manejo de Estados
```javascript
// Patrón estándar para componentes con datos
const [loading, setLoading] = useState(true);
const [data, setData] = useState(defaultState);
const [error, setError] = useState(null);

useEffect(() => {
  loadData();
}, [dependencies]);
```

### Formato de Datos
```javascript
// Funciones utilitarias consistentes
export const formatCurrency = (amount) => 
  new Intl.NumberFormat('es-AR', {
    style: 'currency', 
    currency: 'ARS'
  }).format(amount);

export const formatPercentage = (percentage) => 
  `${percentage.toFixed(1)}%`;
```

### Manejo de Errores
- **Client-side**: Interceptores Axios con toast notifications
- **User feedback**: Mensajes en español contextualizados
- **Graceful degradation**: Fallbacks para funcionalidades críticas

---

## 🔐 SEGURIDAD Y AUTENTICACIÓN

### Estado Actual
- **Modo Demo**: Usuario mock `user123`
- **Header**: `x-caller-id` para identificación
- **Sin JWT**: Implementación simplificada para desarrollo

### Roadmap de Seguridad
- [ ] Implementar JWT tokens
- [ ] Sistema de login/registro
- [ ] Roles y permisos
- [ ] Encriptación de datos sensibles
- [ ] Rate limiting

---

## 🧪 TESTING Y CALIDAD

### Testing Strategy
- **Unit Tests**: Para servicios y utilidades
- **Integration Tests**: Para flujos completos
- **E2E Tests**: Para casos de uso críticos (futuro)

### Herramientas de Testing
```json
{
  "@testing-library/react": "^13.4.0",
  "@testing-library/jest-dom": "^5.16.5",
  "@testing-library/user-event": "^14.4.3"
}
```

### Code Quality
- **ESLint**: Configurado con react-app rules
- **Prettier**: Formatting automático (a configurar)
- **Conventional Commits**: Para historial limpio (recomendado)

---

## 🚀 DEPLOYMENT Y CONFIGURACIÓN

### Variables de Entorno
```env
# Desarrollo
REACT_APP_API_URL=http://localhost:8080/api/v1

# Producción
REACT_APP_API_URL=https://api.financialengine.com/api/v1
```

### Build Process
```bash
# Desarrollo
npm start                # Puerto 3000

# Producción
npm run build           # Genera carpeta build/
```

### Proxy Configuration
```json
// package.json
"proxy": "http://localhost:8080"
```

### Deployment Options
- **Frontend**: Hosting estático (CDN)
- **Backend**: Servidores cloud o VPS
- **Database**: MySQL en cloud o containerizada

---

## 📈 MÉTRICAS Y PERFORMANCE

### Métricas Técnicas Actuales
- **Bundle Size**: ~2.5MB (con optimización)
- **First Load**: <3s en conexión estándar
- **Time to Interactive**: <5s promedio
- **Lighthouse Score**: 85+ (a validar)

### Optimizaciones Implementadas
- **Code Splitting**: Por rutas principales
- **Lazy Loading**: Para gráficos y componentes pesados
- **Memoization**: En cálculos repetitivos
- **Asset Optimization**: Imágenes y CSS optimizados

---

## 🔮 ROADMAP Y FUTURAS FUNCIONALIDADES

### Próximas Funcionalidades (Corto Plazo)
- [ ] **Modo Oscuro**: Sistema de temas
- [ ] **PWA**: Progressive Web App capabilities
- [ ] **Notificaciones Push**: Recordatorios de gastos pendientes
- [ ] **Exportación**: PDF y Excel de reportes
- [ ] **Filtros Avanzados**: Más granularidad en búsquedas

### Funcionalidades Mediano Plazo
- [ ] **Presupuestos**: Creación y seguimiento de presupuestos
- [ ] **Goals**: Metas de ahorro con tracking
- [ ] **Recurring Transactions**: Gastos e ingresos recurrentes
- [ ] **Multi-currency**: Soporte para múltiples monedas
- [ ] **Bank Integration**: Conexión con APIs bancarias

### Funcionalidades Largo Plazo
- [ ] **Machine Learning**: Predicciones de gastos
- [ ] **Social Features**: Compartir logros y metas
- [ ] **Mobile App**: React Native companion
- [ ] **API Pública**: Para integraciones de terceros

---

## 🤝 GUIDELINES DE DESARROLLO

### Convenciones de Código
- **Componentes**: PascalCase (`Dashboard.jsx`)
- **Funciones**: camelCase (`loadDashboardData`)
- **Constantes**: UPPER_SNAKE_CASE (`MOCK_USER_ID`)
- **CSS Classes**: kebab-case (`primary-color`)

### Estructura de Componentes
```javascript
// Imports
import React, { useState, useEffect } from 'react';
import { ExternalLibrary } from 'library';
import { InternalComponent } from '../components';

// Component
const ComponentName = () => {
  // States
  const [state, setState] = useState(defaultValue);
  
  // Effects
  useEffect(() => {
    // Side effects
  }, [dependencies]);
  
  // Functions
  const handleSomething = () => {
    // Logic
  };
  
  // Render
  return (
    <div className="component-container">
      {/* JSX */}
    </div>
  );
};

export default ComponentName;
```

### Git Workflow (Recomendado)
```bash
# Feature branch
git checkout -b feature/nueva-funcionalidad

# Commits descriptivos
git commit -m "feat: agregar filtro por fecha en reportes"

# Pull request a main
```

---

## 📞 CONTACTO Y SOPORTE

### Documentación
- **README.md**: Documentación técnica de instalación
- **docs/**: Documentación detallada del proyecto
- **Swagger**: http://localhost:8080/swagger/ (backend)

### Recursos de Desarrollo
- **React**: Documentación oficial del framework
- **Tailwind CSS**: Documentación de la librería de estilos
- **Recharts**: Documentación de la librería de gráficos

---

## 🏁 CONCLUSIÓN

Este proyecto representa una aplicación financiera moderna y robusta, construida con las mejores prácticas actuales de desarrollo frontend. La arquitectura limpia, el diseño consistente y la funcionalidad completa lo convierten en una base sólida para evolucionar hacia una plataforma financiera más avanzada.

**Estado Actual**: ✅ Frontend production-ready, backend en optimización
**Próximo Milestone**: Completar transición a endpoints analíticos del backend
**Visión**: Convertirse en la herramienta de gestión financiera personal más intuitiva del mercado hispanohablante

---

*Documento actualizado: Enero 2025*
*Versión: 1.0.0*
*Autor: Financial Resume Engine Team* 