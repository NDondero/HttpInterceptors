# HttpInterceptors

Demostración pedagógica de interceptores HTTP funcionales en Angular y autenticación JWT.

La aplicación muestra:

- envío automático del access token a solicitudes API protegidas;
- renovación automática de la sesión ante una respuesta `401`;
- reintento de una solicitud con el nuevo access token;
- una única renovación compartida cuando varias solicitudes fallan al mismo tiempo;
- logout, cancelación de renovaciones y redirección al login cuando la sesión expira;
- una demora simulada de 500 ms para observar visualmente las solicitudes HTTP.

El objetivo es mantener la lógica fácil de seguir, separar responsabilidades y enseñar cómo `HttpInterceptorFn`, RxJS, Angular Signals y `HttpTestingController` forman parte de una implementación autenticada.

> Esta implementación es una demostración educativa. Mantiene los tokens en `localStorage` y no reemplaza una estrategia completa de seguridad para producción.

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

Las pruebas utilizan Vitest integrado con Angular CLI.

La rama actual amplía la cobertura para comprobar:

- persistencia del login y limpieza del logout;
- cancelación de una renovación en curso;
- compartición de una única renovación;
- ausencia de refresh token;
- respuestas tardías de login ignoradas después de logout;
- agregado del header Bearer;
- exclusión de assets y endpoints de autenticación;
- refresh, reintento y repetición máxima de una solicitud;
- renovación fallida concurrente con una sola transición de expiración;
- navegación al login y eliminación de tokens tras una sesión inválida.

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

## Organización autenticación

Durante el proceso de auditoría se separó el flujo por responsabilidades, manteniendo un concepto principal por archivo:

- `src/app/auth/data-access/auth.interceptor.ts`: coordina la cadena HTTP.
- `src/app/auth/data-access/auth.service.ts`: administra sesión, tokens, renovación y cancelación.
- `src/app/auth/utils/access-token.ts`: agrega el header Bearer.
- `src/app/auth/utils/auth-request.ts`: identifica endpoints de autenticación y solicitudes API protegidas.
- `src/app/auth/utils/auth-http-context.ts`: marca solicitudes que ya fueron reintentadas.
- `src/app/auth/utils/retry-request.ts`: recrea y reintenta una solicitud con el nuevo token.
- `src/app/auth/utils/expire-session.ts`: concentra logout y navegación al login.
- `src/app/auth/data-access/auth.model.ts`: define credenciales y respuesta de autenticación.
- `src/app/dev/delay.interceptor.ts`: agrega la demora de demostración.

Esta estructura conserva el mismo comportamiento de autenticación que la rama anterior, pero hace más explícita cada decisión y evita que el interceptor acumule todos los conceptos.

Cada interceptor recibe una `HttpRequest`, puede inspeccionarla o clonarla y continúa la cadena llamando a `next(req)`.

## Flujo de autenticación actual

1. El usuario introduce sus credenciales en el formulario de login.
2. `AuthService.login()` realiza `POST /api/v1/auth/login`.
3. El backend responde con un access token y un refresh token.
4. `AuthService` guarda ambos tokens en `localStorage` y actualiza sus signals.
5. El interceptor excluye los endpoints de autenticación y las solicitudes que no sean API protegidas.
6. Para una solicitud protegida, agrega el access token mediante el header `Authorization`.
7. Si recibe `401`, solicita una renovación mediante `POST /api/v1/auth/refresh`.
8. Varias solicitudes pueden compartir una renovación activa mediante `shareReplay()` y `refreshInFlight`.
9. Tras una renovación correcta, el interceptor reintenta una vez la solicitud original con el nuevo token.
10. Si la renovación falla o el reintento vuelve a devolver `401`, expira la sesión y navega una sola vez a `/login`.
11. `logout()` cancela la renovación activa, elimina los tokens y evita que una respuesta tardía restaure la sesión.
12. Mientras se ejecuta la renovación, `refreshing()` expone el estado y la vista principal pausa temporalmente el polling.

## Identificación de solicitudes

Las utilidades de autenticación usan la ruta URL en lugar de simples coincidencias del texto:

- una solicitud relativa debe pertenecer al prefijo `/api/`;
- `/api/v1/auth/...` se considera una solicitud de autenticación;
- una URL absoluta protegida solo se admite si comparte el origen actual;
- assets y otros recursos fuera de `/api` no reciben el access token.

## Contexto de reintento

El interceptor marca la solicitud reintentada mediante `HttpContextToken`. Así, una respuesta `401` posterior al refresh no inicia otro ciclo de renovación infinito: expira directamente la sesión.

## Renovación y concurrencia

`AuthService.refresh()` mantiene una petición compartida en `refreshInFlight` mientras la renovación está activa. `shareReplay({ bufferSize: 1, refCount: true })` comparte el resultado con los suscriptores y `finalize()` limpia el estado al finalizar o fallar.

Además, la auditoría añadió:

- generación de sesión para ignorar respuestas de login iniciadas antes de otro logout;
- `takeUntil()` para cancelar el refresh HTTP cuando se invalida la sesión;
- estado unificado de expiración para evitar llamadas repetidas a logout y navegación;
- tipado explícito de los contratos observables del servicio.
