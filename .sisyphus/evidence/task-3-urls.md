# T3: Configuración de URLs y Hosts

## Variables de Entorno

- Ninguna variable VITE*RIFT*_ o RIFT*HUB*_ está definida en el entorno
- rift-next usa .env con RIFT_JWT_SECRET=mimic-secret-key-2024

## URLs por Componente

| Componente   | HTTP URL               | WS URL                       | Fuente                               |
| ------------ | ---------------------- | ---------------------------- | ------------------------------------ |
| web-next     | http://localhost:51001 | ws://localhost:51001/mobile  | rift-client.ts:80, http-client.ts:24 |
| rift-next    | http://0.0.0.0:51001   | ws://0.0.0.0:51001           | env-config.ts:36,46                  |
| conduit-next | http://localhost:51001 | ws://localhost:51001/conduit | manager.rs:27, hub.rs:10             |

## Vite Config (web-next)

- server.host: 0.0.0.0
- server.allowedHosts: true (permite cualquier host)

## Conectividad Cross-Host

- curl http://127.0.0.1:51001/health/protocol ✅ {"riftOpcodesLoaded":true}
- curl http://localhost:51001/health/protocol ✅ {"riftOpcodesLoaded":true}
- LAN IP: no disponible (hostname no instalado)

## Conclusión

- No hay mismatch de URL/host. Todos los componentes apuntan a localhost:51001.
- rift-next escucha en 0.0.0.0, así que es accesible desde cualquier interfaz.
- No se requiere fix de configuración de URL/host.
