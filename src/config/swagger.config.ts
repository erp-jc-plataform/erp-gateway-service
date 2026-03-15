import swaggerJsdoc from 'swagger-jsdoc'

const PORT = process.env.PORT || 4000

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Business ERP — API Gateway',
      version: '1.0.0',
      description: `
## API Gateway para Business ERP

Gateway central que orquesta todos los microservicios del sistema.
Expone endpoints REST (proxy) y un endpoint GraphQL unificado.

### Autenticación
Todos los endpoints protegidos requieren un **JWT Bearer Token**.
Obtenlo en \`POST /api/auth/login\` y úsalo en el header:
\`\`\`
Authorization: Bearer <token>
\`\`\`

### Microservicios
| Servicio | Puerto | Documentación |
|----------|--------|---------------|
| Business-Security (Auth) | :8000 | [/docs](http://localhost:8000/docs) |
| Business-Licensing | :3001 | [/api-docs](http://localhost:3001/api-docs) |
| Business-CRM | :8003 | [/api-docs](http://localhost:8003/api-docs) |

### GraphQL
Explora el schema interactivo en [Apollo Sandbox](http://localhost:${PORT}/graphql)
      `,
      contact: {
        name: 'Business ERP Dev Team',
      },
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Desarrollo local',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token JWT obtenido desde POST /api/auth/login',
        },
      },
      schemas: {
        LoginRequest: {
          type: 'object',
          required: ['usuario', 'contrasenia'],
          properties: {
            usuario: { type: 'string', example: 'admin' },
            contrasenia: { type: 'string', example: 'admin123', format: 'password' },
          },
        },
        TokenResponse: {
          type: 'object',
          properties: {
            access_token: {
              type: 'string',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            },
            token_type: { type: 'string', example: 'bearer' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            error: { type: 'string', example: 'No autorizado' },
            message: { type: 'string' },
            timestamp: { type: 'string', format: 'date-time' },
          },
        },
        HealthResponse: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['healthy', 'degraded', 'error'] },
            timestamp: { type: 'string', format: 'date-time' },
            gateway: {
              type: 'object',
              properties: {
                version: { type: 'string' },
                uptime: { type: 'number' },
              },
            },
            services: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  url: { type: 'string' },
                  status: { type: 'string', enum: ['online', 'offline'] },
                  responseTime: { type: 'number' },
                },
              },
            },
          },
        },
        GraphQLRequest: {
          type: 'object',
          required: ['query'],
          properties: {
            query: {
              type: 'string',
              example: '{ customers(pagina: 1, limite: 10) { data { id nombre email } total } }',
            },
            variables: {
              type: 'object',
              example: {},
            },
            operationName: {
              type: 'string',
              example: null,
              nullable: true,
            },
          },
        },
        GraphQLResponse: {
          type: 'object',
          properties: {
            data: { type: 'object' },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  message: { type: 'string' },
                  extensions: { type: 'object' },
                },
              },
            },
          },
        },
      },
    },
    security: [],
    paths: {
      // ==========================================
      // GATEWAY PROPIO
      // ==========================================
      '/health': {
        get: {
          tags: ['Gateway'],
          summary: 'Estado del Gateway y microservicios',
          description: 'Verifica que el Gateway y todos los microservicios estén operativos.',
          responses: {
            '200': {
              description: 'Todos los servicios operativos',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/HealthResponse' } } },
            },
            '503': {
              description: 'Uno o más servicios caídos',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/HealthResponse' } } },
            },
          },
        },
      },
      '/info': {
        get: {
          tags: ['Gateway'],
          summary: 'Información y rutas del Gateway',
          description: 'Lista todas las rutas configuradas en el Gateway.',
          responses: {
            '200': { description: 'Info del Gateway' },
          },
        },
      },

      // ==========================================
      // GRAPHQL
      // ==========================================
      '/graphql': {
        post: {
          tags: ['GraphQL'],
          summary: 'Endpoint GraphQL unificado',
          description: `
Endpoint GraphQL que orquesta múltiples microservicios.
Requiere autenticación JWT.

**Explorar el schema:** [Apollo Sandbox](http://localhost:${PORT}/graphql)

#### Queries disponibles:
\`\`\`graphql
# Listar clientes con paginación
query {
  customers(pagina: 1, limite: 10) {
    data { id nombre email empresa }
    total totalPaginas
  }
}

# Obtener un cliente por ID
query {
  customer(id: "1") {
    id nombre email telefono empresa
  }
}

# Verificar licencias del usuario autenticado
query {
  myLicenses {
    modulo activo fechaVencimiento
  }
  checkModule(modulo: "CLIENTES")
}
\`\`\`

#### Mutations disponibles:
\`\`\`graphql
mutation {
  createCustomer(input: {
    nombre: "Empresa SA"
    email: "empresa@mail.com"
    telefono: "555-1234"
    empresa: "Empresa SA"
  }) { id nombre }
}
\`\`\`
          `,
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/GraphQLRequest' },
                examples: {
                  listCustomers: {
                    summary: 'Listar clientes',
                    value: { query: '{ customers(pagina: 1, limite: 5) { data { id nombre email } total } }' },
                  },
                  myLicenses: {
                    summary: 'Mis licencias',
                    value: { query: '{ myLicenses { modulo activo } checkModule(modulo: "CLIENTES") }' },
                  },
                  createCustomer: {
                    summary: 'Crear cliente',
                    value: {
                      query: 'mutation CreateCustomer($input: CustomerInput!) { createCustomer(input: $input) { id nombre email } }',
                      variables: { input: { nombre: 'Test SA', email: 'test@test.com', empresa: 'Test SA' } },
                      operationName: 'CreateCustomer',
                    },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Respuesta GraphQL (siempre 200 aunque haya errores de negocio)',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/GraphQLResponse' } } },
            },
            '401': { description: 'Token JWT faltante o inválido' },
          },
        },
      },

      // ==========================================
      // AUTH (proxy → Business-Security :8000)
      // ==========================================
      '/api/auth/login': {
        post: {
          tags: ['Autenticación'],
          summary: 'Login — obtener JWT',
          description: 'Proxy → **Business-Security** (:8000). No requiere autenticación previa.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/LoginRequest' },
              },
            },
          },
          responses: {
            '200': {
              description: 'Login exitoso',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/TokenResponse' } } },
            },
            '401': { description: 'Credenciales incorrectas' },
          },
        },
      },
      '/api/auth/me': {
        get: {
          tags: ['Autenticación'],
          summary: 'Perfil del usuario autenticado',
          description: 'Proxy → **Business-Security** (:8000).',
          security: [{ BearerAuth: [] }],
          responses: {
            '200': { description: 'Datos del usuario' },
            '401': { description: 'Token inválido' },
          },
        },
      },

      // ==========================================
      // CLIENTES / CRM (proxy → :8003)
      // ==========================================
      '/api/clientes': {
        get: {
          tags: ['CRM — Clientes'],
          summary: 'Listar clientes',
          description: 'Proxy → **Business-CRM** (:8003). Requiere módulo **CLIENTES**.',
          security: [{ BearerAuth: [] }],
          parameters: [
            { name: 'pagina', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limite', in: 'query', schema: { type: 'integer', default: 10 } },
            { name: 'busqueda', in: 'query', schema: { type: 'string' } },
          ],
          responses: {
            '200': { description: 'Lista de clientes paginada' },
            '401': { description: 'No autenticado' },
            '403': { description: 'Sin licencia para módulo CLIENTES' },
            '502': { description: 'CRM Service no disponible' },
          },
        },
        post: {
          tags: ['CRM — Clientes'],
          summary: 'Crear cliente',
          description: 'Proxy → **Business-CRM** (:8003). Requiere módulo **CLIENTES**.',
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['nombre', 'email'],
                  properties: {
                    nombre: { type: 'string', example: 'Empresa SA' },
                    email: { type: 'string', example: 'empresa@mail.com' },
                    telefono: { type: 'string', example: '555-1234' },
                    empresa: { type: 'string', example: 'Empresa SA' },
                  },
                },
              },
            },
          },
          responses: {
            '201': { description: 'Cliente creado' },
            '401': { description: 'No autenticado' },
            '403': { description: 'Sin licencia para módulo CLIENTES' },
          },
        },
      },
      '/api/clientes/{id}': {
        get: {
          tags: ['CRM — Clientes'],
          summary: 'Obtener cliente por ID',
          description: 'Proxy → **Business-CRM** (:8003).',
          security: [{ BearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: {
            '200': { description: 'Datos del cliente' },
            '404': { description: 'Cliente no encontrado' },
          },
        },
        put: {
          tags: ['CRM — Clientes'],
          summary: 'Actualizar cliente',
          description: 'Proxy → **Business-CRM** (:8003).',
          security: [{ BearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { type: 'object' } } },
          },
          responses: {
            '200': { description: 'Cliente actualizado' },
            '404': { description: 'Cliente no encontrado' },
          },
        },
        delete: {
          tags: ['CRM — Clientes'],
          summary: 'Eliminar cliente',
          description: 'Proxy → **Business-CRM** (:8003).',
          security: [{ BearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: {
            '200': { description: 'Cliente eliminado' },
            '404': { description: 'Cliente no encontrado' },
          },
        },
      },

      // ==========================================
      // LICENCIAS (proxy → :3001)
      // ==========================================
      '/api/licencias': {
        get: {
          tags: ['Licencias'],
          summary: 'Listar licencias',
          description: 'Proxy → **Business-Licensing** (:3001).',
          security: [{ BearerAuth: [] }],
          responses: {
            '200': { description: 'Lista de licencias' },
            '401': { description: 'No autenticado' },
          },
        },
      },
      '/api/licencias/validate/{clienteId}/{modulo}': {
        get: {
          tags: ['Licencias'],
          summary: 'Validar licencia de módulo',
          description: 'Proxy → **Business-Licensing** (:3001). Verifica si un cliente tiene acceso a un módulo.',
          security: [{ BearerAuth: [] }],
          parameters: [
            { name: 'clienteId', in: 'path', required: true, schema: { type: 'integer' } },
            { name: 'modulo', in: 'path', required: true, schema: { type: 'string', example: 'CLIENTES' } },
          ],
          responses: {
            '200': { description: 'Resultado de validación' },
          },
        },
      },

      // ==========================================
      // EMPLEADOS (proxy → :8002)
      // ==========================================
      '/api/empleados': {
        get: {
          tags: ['RRHH — Empleados'],
          summary: 'Listar empleados',
          description: 'Proxy → **Business-Employees** (:8002). Requiere módulo **EMPLEADOS**.',
          security: [{ BearerAuth: [] }],
          responses: {
            '200': { description: 'Lista de empleados' },
            '403': { description: 'Sin licencia para módulo EMPLEADOS' },
            '502': { description: 'Employees Service no disponible' },
          },
        },
      },

      // ==========================================
      // VENTAS (proxy → :8004)
      // ==========================================
      '/api/ventas': {
        get: {
          tags: ['Ventas'],
          summary: 'Listar ventas',
          description: 'Proxy → **Business-Sales** (:8004). Requiere módulo **VENTAS**.',
          security: [{ BearerAuth: [] }],
          responses: {
            '200': { description: 'Lista de ventas' },
            '403': { description: 'Sin licencia para módulo VENTAS' },
          },
        },
      },
      '/api/cotizaciones': {
        get: {
          tags: ['Ventas'],
          summary: 'Listar cotizaciones',
          description: 'Proxy → **Business-Sales** (:8004). Requiere módulo **VENTAS**.',
          security: [{ BearerAuth: [] }],
          responses: {
            '200': { description: 'Lista de cotizaciones' },
            '403': { description: 'Sin licencia para módulo VENTAS' },
          },
        },
      },
    },
    tags: [
      { name: 'Gateway', description: 'Endpoints propios del API Gateway' },
      { name: 'GraphQL', description: 'Endpoint GraphQL unificado — orquesta múltiples servicios' },
      { name: 'Autenticación', description: 'Login y gestión de sesión → Business-Security :8000' },
      { name: 'CRM — Clientes', description: 'CRUD de clientes → Business-CRM :8003' },
      { name: 'Licencias', description: 'Gestión de licencias por módulo → Business-Licensing :3001' },
      { name: 'RRHH — Empleados', description: 'Gestión de empleados → Business-Employees :8002' },
      { name: 'Ventas', description: 'Ventas y cotizaciones → Business-Sales :8004' },
    ],
  },
  apis: [],
}

export const swaggerSpec = swaggerJsdoc(options)
