# Seguridad, RBAC y auditoria

## Principios

- Deny-by-default: todo endpoint privado requiere permisos explicitos.
- Los roles agrupan permisos; los permisos son la unidad de autorizacion.
- El proveedor siempre opera con `supplierId` tomado del token, nunca desde el cliente.
- Las descargas pasan por backend y nunca exponen `storagePath`.
- No hay eliminacion fisica por API para documentos, ofertas o logs.

## Permisos iniciales

Formato: `recurso:accion:alcance`.

Ejemplos:

- `bids:read:internal`
- `bids:read:own`
- `bids:submit:own`
- `files:download:internal`
- `files:download:own`
- `audit:read:internal`

## Auditoria obligatoria

Se registran eventos criticos con:

- actorId
- role
- ip
- action
- entity
- entityId
- result
- metadata

Eventos minimos:

- Login exitoso/fallido.
- Cambio de rol o estado de usuario.
- Homologacion o bloqueo de proveedor.
- Publicacion/cierre de licitacion.
- Addenda o anulacion logica de documento.
- Envio/reemplazo/anulacion de oferta.
- Vista interna de oferta.
- Descarga interna de documento de oferta.
- Intentos denegados relevantes.
