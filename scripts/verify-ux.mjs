import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const frontend = join(root, 'frontend', 'src');
const errors = [];

function walk(directory) {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

const requiredFiles = [
  'frontend/src/styles/tokens.css',
  'frontend/src/styles/base.css',
  'frontend/src/styles/components.css',
  'frontend/src/shared/components/ApplicationShell.tsx',
  'frontend/src/shared/components/FeedbackHost.tsx',
  'frontend/src/shared/components/NotFoundPage.tsx',
  'docs/ux-audit.md',
  'docs/ux-migration-plan.md',
];

for (const file of requiredFiles) {
  if (!existsSync(join(root, file))) errors.push(`Falta ${file}`);
}

const sourceFiles = walk(frontend).filter((file) => /\.(ts|tsx)$/.test(file));
for (const file of sourceFiles) {
  const source = readFileSync(file, 'utf8');
  if (/window\.(alert|confirm)\s*\(/.test(source)) {
    errors.push(`${relative(root, file)} usa una alerta nativa`);
  }
  if (/from ['"](?:react-icons|@fortawesome|@heroicons)/.test(source)) {
    errors.push(`${relative(root, file)} incorpora una segunda librería de iconos`);
  }
}

const stylesEntry = readFileSync(join(frontend, 'styles.css'), 'utf8');
for (const layer of ['./styles/tokens.css', './styles/base.css', './styles/components.css']) {
  if (!stylesEntry.includes(layer)) errors.push(`styles.css no carga ${layer}`);
}

const app = readFileSync(join(frontend, 'App.tsx'), 'utf8');
const routeCount = (app.match(/<Route(?:\s|>)/g) ?? []).length;
const requiredRoutes = [
  '/login',
  '/supplier/register',
  '/supplier',
  '/internal',
  'users-roles',
  'requesting-areas',
  'suppliers',
  'tenders',
  'documents',
  'questions',
  'bids',
  'evaluation/documental',
  'evaluation/technical',
  'evaluation/economic',
  'comparison',
  'awards',
  'expediente',
  'audit',
];
for (const route of requiredRoutes) {
  if (!app.includes(`path="${route}"`)) errors.push(`Falta la ruta ${route}`);
}
if (!app.includes('path="*"')) errors.push('Falta la página 404');
if (routeCount < 40) errors.push(`Solo se detectaron ${routeCount} declaraciones de ruta`);

for (const layout of [
  'modules/internal-dashboard/InternalLayout.tsx',
  'modules/supplier-portal/SupplierLayout.tsx',
]) {
  const source = readFileSync(join(frontend, layout), 'utf8');
  if (!source.includes('ApplicationShell')) errors.push(`${layout} no usa ApplicationShell`);
}

if (errors.length) {
  console.error(errors.map((error) => `- ${error}`).join('\n'));
  process.exit(1);
}

console.log(`UX verificada: ${routeCount} declaraciones de ruta y ${sourceFiles.length} archivos.`);
