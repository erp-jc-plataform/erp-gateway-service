# Business Gateway

API Gateway centralizado para el ecosistema de microservicios **Business ERP**. Actua como punto de entrada unico para el frontend, manejando autenticacion JWT, validacion de licencias por modulo, proxy a servicios backend, GraphQL y documentacion Swagger.

---

## Lenguaje y Stack Tecnologico

| Capa | Tecnologia | Version |
|------|-----------|---------|
| Lenguaje | **TypeScript** | 5.3.3 |
| Runtime | **Node.js** | >= 18 |
| Framework HTTP | **Express** | 4.18.2 |
| GraphQL Server | **Apollo Server** | 4.13.0 |
| Proxy | **http-proxy-middleware** | 2.0.6 |
| Autenticacion | **jsonwebtoken** | 9.0.2 |
| Cliente HTTP | **axios** | 1.6.2 |
| Rate Limiting | **express-rate-limit** | 7.1.5 |
| Seguridad headers | **helmet** | 7.1.0 |
| Documentacion API | **swagger-ui-express + swagger-jsdoc** | 5.0.1 / 6.2.8 |
| Logging HTTP | **morgan** | 1.10.0 |
| Dev server | **tsx watch** | 4.7.0 |

---

## Caracteristicas

- **Proxy inteligente** a todos los microservicios del ecosistema
- **Autenticacion JWT** centralizada — valida el token antes de reenviar la peticion
- **Validacion de licencias** por modulo (EMPLEADOS, CLIENTES, VENTAS)
- **GraphQL** con Apollo Server — queries y mutations sobre CRM y Licencias
- **Swagger UI** en `/docs` con spec OpenAPI 3.0 completa
- **Rate limiting** global y por ruta
- **Headers automaticos** de contexto de usuario hacia los microservicios
- **Health check** con estado de todos los servicios
- **CORS** configurable por entorno

---

## Estructura del Proyecto

```
Business-Gateway/
├── src/
│   ├── index.ts                  # Punto de entrada (Express + Apollo)
│   ├── config/
│   │   ├── routes.config.ts      # Definicion de rutas proxy
│   │   └── swagger.config.ts     # Spec OpenAPI 3.0
│   ├── graphql/
│   │   ├── context.ts            # Contexto GraphQL + helpers de auth
│   │   ├── schema/
│   │   │   ├── customer.schema.ts
│   │   │   ├── license.schema.ts
│   │   │   └── index.ts
│   │   └── resolvers/
│   │       ├── customer.resolver.ts
│   │       ├── license.resolver.ts
│   │       └── index.ts
│   ├── middleware/               # Auth, rate-limiting, etc.
│   └── types/                    # Tipos TypeScript compartidos
├── package.json
├── tsconfig.json
└── .env
```

---

## Instalacion

### Requisitos previos

- Node.js >= 18
- npm >= 9

### Pasos

```powershell
# 1. Entrar al directorio
cd C:\Proyectos\BusinessApp\Business-Gateway

# 2. Instalar dependencias
npm install

# 3. Crear archivo de entorno
copy .env.example .env
```

### Variables de entorno (`.env`)

```env
PORT=4000

# URLs de microservicios
AUTH_SERVICE_URL=http://localhost:8000
LICENSING_SERVICE_URL=http://localhost:3001
EMPLOYEES_SERVICE_URL=http://localhost:8002
CLIENTS_SERVICE_URL=http://localhost:8003
SALES_SERVICE_URL=http://localhost:8004

# Debe coincidir con la SECRET_KEY del microservicio de seguridad
SECRET_KEY=your-secret-key-change-in-production

# Origenes CORS permitidos
ALLOWED_ORIGINS=http://localhost:4200,http://localhost:3000
```

---

## Levantar el Microservicio

### Desarrollo (hot-reload)

```powershell
cd C:\Proyectos\BusinessApp\Business-Gateway
npm run dev
```

El servidor arranca en `http://localhost:4000` con recarga automatica al guardar cambios.

### Produccion

```powershell
# Compilar TypeScript
npm run build

# Ejecutar build compilado
npm start
```

### Verificar que esta corriendo

```powershell
# Health check
Invoke-RestMethod -Uri http://localhost:4000/health | ConvertTo-Json

# Info del gateway
Invoke-RestMethod -Uri http://localhost:4000/info | ConvertTo-Json
```

---

## URLs Disponibles

| URL | Descripcion |
|-----|-------------|
| `http://localhost:4000/health` | Estado del gateway y microservicios |
| `http://localhost:4000/info` | Informacion del gateway y rutas |
| `http://localhost:4000/graphql` | Endpoint GraphQL (Apollo Sandbox en dev) |
| `http://localhost:4000/docs` | Swagger UI — documentacion interactiva |
| `http://localhost:4000/docs/swagger.json` | Spec OpenAPI 3.0 en JSON |

---

## Rutas Proxy Configuradas

### Publicas (sin autenticacion)

| Ruta | Servicio destino | Puerto |
|------|-----------------|--------|
| `POST /api/auth/login` | Business-Security | 8000 |
| `POST /api/auth/login-form` | Business-Security | 8000 |

### Protegidas (requieren JWT)

| Ruta | Servicio destino | Puerto |
|------|-----------------|--------|
| `GET /api/auth/me` | Business-Security | 8000 |
| `GET /api/usuarios` | Business-Security | 8000 |
| `GET /api/perfiles` | Business-Security | 8000 |
| `GET /api/menu/tree` | Business-Security | 8000 |
| `* /api/licencias` | Business-Licensing | 3001 |
| `* /api/modulos` | Business-Licensing | 3001 |

### Con validacion de modulo de licencia

| Ruta | Servicio destino | Modulo requerido |
|------|-----------------|-----------------|
| `* /api/empleados` | Business-Security | `EMPLEADOS` |
| `* /api/clientes` | Business-CRM | `CLIENTES` |
| `* /api/ventas` | Business-Sales | `VENTAS` |
| `* /api/cotizaciones` | Business-Sales | `VENTAS` |

---

## GraphQL

El endpoint GraphQL en `/graphql` requiere autenticacion (Bearer token).
En modo desarrollo, Apollo Sandbox esta disponible directamente en `http://localhost:4000/graphql`.

### Queries disponibles

```graphql
# Clientes (requiere modulo CLIENTES — proxea a Business-CRM :8003)
query {
  customers(pagina: 1, limite: 10) {
    data { id nombre email telefono }
    total
    pagina
  }
  customer(id: 1) { id nombre email }
}

# Licencias (proxea a Business-Licensing :3001)
query {
  myLicenses { modulo activo fechaVencimiento }
  checkModule(modulo: "CLIENTES")
}
```

### Mutations disponibles

```graphql
mutation {
  createCustomer(input: { nombre: "Empresa SA", email: "info@empresa.com" }) {
    id nombre email
  }
  updateCustomer(id: 1, input: { telefono: "0999999999" }) { id telefono }
  deleteCustomer(id: 1)
}
```

### Probar con PowerShell

```powershell
# Obtener token primero
$r = Invoke-RestMethod -Uri 'http://localhost:4000/api/auth/login' `
  -Method Post -ContentType 'application/json' `
  -Body '{"usuario":"admin","contrasenia":"admin123"}'
$token = $r.access_token

# Ejecutar query GraphQL
$body = '{"query":"query { myLicenses { modulo activo } }"}'
Invoke-RestMethod -Uri 'http://localhost:4000/graphql' `
  -Method Post -ContentType 'application/json' `
  -Headers @{ Authorization = "Bearer $token" } `
  -Body $body | ConvertTo-Json
```

---

## Swagger

La documentacion interactiva esta disponible en `http://localhost:4000/docs`.

Para probar endpoints protegidos desde Swagger:

1. Ejecutar `POST /api/auth/login` con `{"usuario":"admin","contrasenia":"admin123"}`
2. Copiar el `access_token` de la respuesta
3. Hacer clic en **Authorize** (arriba a la derecha)
4. Pegar el token en el campo `BearerAuth` y confirmar
5. Todos los endpoints protegidos quedan autenticados en la sesion actual

---

## Headers Automaticos

El Gateway inyecta estos headers en cada peticion proxeada cuando el usuario esta autenticado:

```
X-User-Id:    123
X-Usuario:    admin
X-Cliente-Id: 1
X-Perfil-Id:  1
X-Module:     EMPLEADOS   (solo si la ruta requiere modulo)
```

Los microservicios pueden leer estos headers para obtener contexto sin necesidad de re-validar el JWT.

---

## Flujo de Autenticacion

```
Login:
  Frontend --> POST /api/auth/login --> Gateway --> Business-Security :8000
                                                          |
  Frontend <-- { access_token }  <-- Gateway <-- JWT generado

Peticion protegida (con modulo):
  Frontend --> GET /api/clientes (Bearer token) --> Gateway
                --> Valida JWT localmente
                --> Consulta licencia modulo CLIENTES --> Business-Licensing :3001
                --> Proxy a Business-CRM :8003
  Frontend <-- Respuesta del CRM
```

---

## Scripts npm

| Comando | Descripcion |
|---------|-------------|
| `npm run dev` | Modo desarrollo con tsx watch (hot-reload) |
| `npm run build` | Compila TypeScript a `dist/` |
| `npm start` | Ejecuta el build compilado |
| `npm run type-check` | Verifica tipos sin compilar |
| `npm run lint` | Linting con ESLint |

---

## Agregar una nueva ruta proxy

Editar `src/config/routes.config.ts`:

```typescript
{
  path: '/api/nuevo-servicio',
  target: process.env.NUEVO_SERVICE_URL || 'http://localhost:8005',
  requireAuth: true,
  requireModule: 'NUEVO_MODULO', // Opcional
}
```

Luego documentar el nuevo endpoint en `src/config/swagger.config.ts`.

---

## Licencia

Proyecto interno — Business ERP.
