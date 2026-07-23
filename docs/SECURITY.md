# Seguridad

- No publique `.env`, respaldos ni almacenamiento privado.
- Genere secretos JWT y contraseñas PostgreSQL únicos por instalación.
- Cambie credenciales de ejemplo antes de desplegar.
- Los archivos se validan en frontend y backend: máximo 2 MB.
- Los proveedores solo asocian archivos propios a su perfil; administradores pueden asociarlos a cualquier proveedor.
- La aplicación no depende de una IP fija.
- La API no inicia si faltan secretos JWT válidos de al menos 32 caracteres.
- Los tokens de actualización se rotan y se revocan al cerrar sesión o cambiar la contraseña.
- El restablecimiento por correo se habilita únicamente con SMTP configurado.
- Solo se aceptan PDF, PNG y JPEG con extensión, MIME y firma binaria coherentes.
