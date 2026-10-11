/**
 * Development environment.
 *
 * Both URLs are same-origin and relative on purpose:
 *
 *  * The backend port lives in exactly one place — `proxy.conf.json` — which the dev
 *    server and the Playwright `webServer` both load. Changing the backend port is a
 *    one-line change there, and nothing here can drift out of sync with it.
 *  * Same-origin means the browser issues no cross-origin request, so the app no longer
 *    depends on the backend's CORS configuration to work in dev.
 *  * `authInterceptor` matches API requests against `apiUrl`; a relative prefix cannot
 *    silently stop matching when the API is reached through a different host or port.
 *
 * `environment.prod.ts` keeps the same relative shape because production is served
 * behind the same origin as the API.
 */
export const environment = {
  production: false,
  apiUrl: '/api',
  wsUrl: '/ws-chat'
};
