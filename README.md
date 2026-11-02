# HttpInterceptors

Demostración pedagógica de interceptores HTTP funcionales en Angular y de su uso con autenticación JWT.

La aplicación muestra dos interceptores:

- **Interceptor de autenticación:** añade el access token al header `Authorization` de las solicitudes protegidas; ante un `401`, intenta renovar la sesión con el refresh token y reintenta la solicitud original. Las solicitudes de autenticación se excluyen.
- **Interceptor de demora:** agrega una espera de 500 ms a las solicitudes que comienzan con `/api/`, útil para observar visualmente el estado de carga y el comportamiento HTTP.

El objetivo es aprender a configurar interceptores, centralizar el manejo de headers, manejar errores de autenticación y encadenar una renovación de sesión mediante Angular.

> Este proyecto es una demostración educativa. Mantiene los tokens en `localStorage` y requiere mejoras adicionales para producción, como compartir renovaciones concurrentes, evitar respuestas tardías después de logout y seleccionar una estrategia de almacenamiento más segura.

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
- Con Docker, Nginx reenvía `/api` al servicio `backend` dentro de la red de contenedores.

Esta configuración evita llamadas cross-origin entre el navegador, Angular CLI y el backend.

## Requisitos

- Node.js 22 o superior
- npm
- Docker y Docker Compose

## Ejecución en desarrollo

Instala las dependencias:

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

Nginx recibe las solicitudes del frontend y las reenvía al backend dentro de la red Docker.

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

Las pruebas utilizan Vitest integrado con Angular CLI. Actualmente cubren la creación básica de componentes, servicios, rutas e interceptores.

## Interceptores

La configuración se encuentra en `src/app/app.config.ts` mediante:

```ts
provideHttpClient(
  withInterceptors([
    delayInterceptor,
    authInterceptor,
  ]),
);
```

Los archivos principales son:

- `src/app/dev/delay.interceptor.ts`: agrega la demora de demostración.
- `src/app/auth/data-access/auth.interceptor.ts`: añade el access token, inicia el refresh ante `401` y reintenta la solicitud.
- `src/app/auth/data-access/auth.service.ts`: administra login, logout, tokens, renovación y estado reactivo.
- `src/app/auth/data-access/auth.model.ts`: define las credenciales y la respuesta de autenticación.

Cada interceptor recibe una `HttpRequest`, puede inspeccionarla o clonarla y continúa la cadena llamando a `next(req)`.

## Flujo de autenticación actual

1. El usuario introduce sus credenciales en el formulario de login.
2. `AuthService` realiza `POST /api/v1/auth/login`.
3. El backend responde con un access token y un refresh token.
4. `AuthService` guarda ambos tokens en `localStorage` y actualiza sus signals.
5. El interceptor excluye las solicitudes de autenticación.
6. Para las solicitudes API protegidas, el interceptor agrega el access token mediante el header `Authorization`.
7. Si una solicitud protegida devuelve `401`, `AuthService.refresh()` envía el refresh token a `POST /api/v1/auth/refresh`.
8. Cuando la renovación termina correctamente, el interceptor guarda los nuevos tokens y reintenta una vez la solicitud original.
9. Si no existe refresh token o la renovación falla, el interceptor elimina la sesión mediante `logout()` y navega a `/login` con una razón de expiración.
10. Mientras se ejecuta la renovación, `refreshing()` expone el estado y la vista principal:
    - detiene temporalmente su polling HTTP;
    - muestra “Refrescando sesión automáticamente”.
11. El interceptor de demora aplica una espera de 500 ms a las solicitudes API.
