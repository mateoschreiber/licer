const insecureValues = new Set([
  'change-me-access-secret',
  'change-me-refresh-secret',
  'generate_on_server',
  'replace-with-a-strong-secret',
]);

function requireSecret(config: Record<string, unknown>, name: string) {
  const value = String(config[name] ?? '').trim();
  if (
    value.length < 32 ||
    insecureValues.has(value) ||
    /^(change|replace|generate|example)/i.test(value)
  ) {
    throw new Error(`${name} debe contener un secreto aleatorio de al menos 32 caracteres`);
  }
}

export function validateEnvironment(config: Record<string, unknown>) {
  for (const name of ['DATABASE_URL', 'JWT_SECRET', 'JWT_REFRESH_SECRET']) {
    if (!String(config[name] ?? '').trim()) {
      throw new Error(`${name} es obligatorio`);
    }
  }

  requireSecret(config, 'JWT_SECRET');
  requireSecret(config, 'JWT_REFRESH_SECRET');

  if (config.PASSWORD_RESET_ENABLED === 'true') {
    for (const name of ['PASSWORD_RESET_BASE_URL', 'SMTP_HOST', 'SMTP_PORT', 'SMTP_FROM']) {
      if (!String(config[name] ?? '').trim()) {
        throw new Error(`${name} es obligatorio cuando PASSWORD_RESET_ENABLED=true`);
      }
    }
  }

  return config;
}
