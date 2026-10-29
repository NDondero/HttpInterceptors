# HttpInterceptors

Demostración pedagógica de los interceptores HTTP de Angular y de su uso con un backend que utiliza autenticación JWT.

El proyecto muestra dos interceptores funcionales:

- **Interceptor de autenticación:** añade el token JWT recibido por el login al header `Authorization` de las solicitudes protegidas. Las solicitudes de autenticación se excluyen.
- **Interceptor de demostración:** agrega una demora de un segundo a las solicitudes que comienzan con `/api/`, útil para observar visualmente el estado de carga y el comportamiento de las peticiones HTTP.

El objetivo es aprender a configurar interceptores, centralizar el manejo de headers HTTP, manipular solicitudes y encadenar comportamientos mediante Angular.

> Este proyecto es una demostración con fines educativos. No debe utilizarse como implementación definitiva de seguridad o almacenamiento de tokens en producción.

## Tecnologías

- Angular 22
- TypeScript
- Angular Signals
- RxJS
- Vitest
- Nginx
- Docker Compose

## Comunicación con el backend

El frontend utiliza rutas relativas `/api/...`; no llama directamente a `http://localhost:8081`.

- En desarrollo, Angular CLI utiliza `proxy.conf.json` para reenviar `/api` al backend local.
- Con Docker, Nginx reenviar `/api` al servicio `backend` dentro de la red de contenedores.

Esta configuración evita que el navegador tenga que realizar llamadas cross-origin entre el frontend y el backend mediante CORS.

## Requisitos

- Node.js 22 o superior
- npm
- Docker y Docker Compose

## Ejecución en desarrollo

Desde esta carpeta, instala las dependencias:

```bash
npm install
```

El backend debe estar disponible en el puerto `8081`. Luego inicia Angular:

```bash
npm start
```

Abre `http://localhost:4200`.

La configuración de proxy está definida en `proxy.conf.json`:

```json
{
  "/api": {
    "target": "http://localhost:8081",
    "secure": false,
    "changeOrigin": true
  }
}
```

## Ejecución con Docker

Desde la raíz del proyecto, prepara las variables de entorno:

```bash
cp .env.example .env
```

Edita `.env` y reemplaza las claves de ejemplo, especialmente las credenciales de PostgreSQL y el secreto JWT. Después inicia los servicios:

```bash
docker compose up --build
```

Abre `http://localhost`.

Nginx recibe las solicitudes del frontend y reenvía las rutas `/api/...` al contenedor `backend`.

## Compilación

Genera la versión optimizada:

```bash
npm run build
```

Los archivos resultantes se guardan en `dist/HttpInterceptors/browser`.

## Pruebas

Ejecuta las pruebas unitarias con:

```bash
npm test
```

Las pruebas utilizan el ejecutor Vitest integrado con Angular CLI.

## Interceptores

La configuración se encuentra en `src/app/app.config.ts` mediante:

```ts
provideHttpClient(withInterceptors([
  delayInterceptor,
  authInterceptor,
]));
```

Los archivos principales son:

- `src/app/dev/delay.interceptor.ts`
- `src/app/auth/data-access/auth.interceptor.ts`
- `src/app/auth/data-access/auth.service.ts`

Cada interceptor recibe una `HttpRequest`, puede modificarla y debe continuar la cadena llamando a `next(req)` o, si corresponde, devolver una nueva solicitud creada con `req.clone(...)`.

## Flujo de autenticación

1. El usuario introduce sus credenciales en el formulario de login.
2. `AuthService` realiza la solicitud `POST` relativa a `/api/v1/auth/login`.
3. El backend responde con los tokens de acceso y actualización.
4. `AuthService` guarda los datos de sesión en `localStorage`.
5. El interceptor de autenticación agrega el header `Authorization: Bearer <token>` a las solicitudes posteriores a `/api/...`, excluyendo las rutas de autenticación.
6. El interceptor de demora aplica la espera simulada a las solicitudes API.

Esta separación permite observar cómo Angular centraliza el comportamiento común de las solicitudes HTTP sin repetir headers o lógica en cada servicio.
