# HttpInterceptors

Demostración pedagógica de interceptores HTTP funcionales en Angular y de su uso con autenticación JWT.

La aplicación muestra dos interceptores:

- **Interceptor de autenticación:** añade el access token al header `Authorization` de las solicitudes API protegidas. Las solicitudes de autenticación se excluyen.
- **Interceptor de demora:** agrega una espera de 500 ms a las solicitudes que comienzan con `/api/`, útil para observar visualmente el estado de carga y encadenar comportamientos HTTP.

Además, la aplicación muestra un flujo básico de sesión:

- guarda el access token y el refresh token en `localStorage`;
- expone el estado de autenticación mediante Angular Signals;
- ante un `401`, elimina la sesión y redirige al formulario de login.

> Este proyecto es una demostración educativa. No implementa renovación automática de tokens ni debe considerarse una solución completa de seguridad o almacenamiento de tokens para producción.

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

Nginx recibe las solicitudes del frontend y las reenvía a `/api/...` dentro de la red Docker.

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

Las pruebas utilizan el ejecutor Vitest integrado con Angular CLI. Actualmente cubren la creación básica de componentes, servicios, rutas e interceptores. Los casos de HTTP pueden ampliarse para verificar cabeceras, respuestas `401`, renovación y concurrencia si se incorpora esa funcionalidad.

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
- `src/app/auth/data-access/auth.interceptor.ts`: añade el access token y maneja respuestas `401`.
- `src/app/auth/data-access/auth.service.ts`: administra login, logout, tokens y estado reactivo.
- `src/app/auth/data-access/auth.model.ts`: define las credenciales y la respuesta de autenticación.

Cada interceptor recibe una `HttpRequest`, puede inspeccionarla o clonarla y continúa la cadena llamando a `next(req)`. Los objetos de solicitud son inmutables, por lo que los cambios se realizan mediante `req.clone(...)`.

## Flujo de autenticación actual

1. El usuario introduce sus credenciales en el formulario de login.
2. `AuthService` realiza `POST /api/v1/auth/login`.
3. El backend responde con un access token y un refresh token.
4. `AuthService` guarda ambos tokens en `localStorage` y actualiza los signals internos.
5. El interceptor excluye las solicitudes cuyo destino contiene `/auth`.
6. Para las solicitudes protegidas que comienzan con `/api`, el interceptor agrega:

   ```text
   Authorization: Bearer <access-token>
   ```

7. El interceptor de demora aplica una espera de 500 ms a las solicitudes API.
8. Si una solicitud protegida devuelve `401`, el interceptor ejecuta `logout()`, elimina ambos tokens y navega a `/login` con una razón de expiración.

El commit actual **no intenta refrescar la sesión ni reintenta automáticamente la solicitud original**. La renovación del access token constituye una evolución pendiente que debería implementarse junto con pruebas de concurrencia, cancelación y manejo de errores.
