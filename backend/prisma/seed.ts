import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const permissions = [
  'auth:login:public',
  'auth:logout:own',
  'users:create:internal',
  'users:read:internal',
  'users:update:internal',
  'roles:create:internal',
  'roles:read:internal',
  'roles:update:internal',
  'suppliers:register:public',
  'suppliers:create:internal',
  'suppliers:read:internal',
  'suppliers:update:internal',
  'suppliers:approve:internal',
  'suppliers:block:internal',
  'suppliers:read:own',
  'suppliers:update:own',
  'tenders:create:internal',
  'tenders:read:internal',
  'tenders:read:published',
  'tenders:update:internal',
  'tenders:publish:internal',
  'tenders:close:internal',
  'tender-documents:create:internal',
  'tender-documents:read:internal',
  'tender-documents:read:published',
  'tender-documents:void:internal',
  'questions:create:own',
  'questions:read:own',
  'questions:read:internal',
  'questions:answer:internal',
  'bids:create:own',
  'bids:read:own',
  'bids:submit:own',
  'bids:replace:own',
  'bids:read:internal',
  'evaluations:create:internal',
  'evaluations:read:internal',
  'evaluations:update:internal',
  'awards:create:internal',
  'awards:cancel:internal',
  'awards:desert:internal',
  'audit:read:internal',
  'files:download:own',
  'files:download:internal',
  'reports:read:internal',
  'notifications:create:internal',
  'notifications:read:own',
  'requesting-areas:create:internal',
  'requesting-areas:read:internal',
  'requesting-areas:update:internal',
  'requesting-areas:delete:internal',
] as const;

const rolePermissions: Record<string, string[]> = {
  ADMIN: [...permissions],
  COMPRAS: [
    'users:read:internal',
    'suppliers:create:internal',
    'suppliers:read:internal',
    'suppliers:update:internal',
    'suppliers:approve:internal',
    'suppliers:block:internal',
    'tenders:create:internal',
    'tenders:read:internal',
    'tenders:update:internal',
    'tenders:publish:internal',
    'tenders:close:internal',
    'tender-documents:create:internal',
    'tender-documents:read:internal',
    'tender-documents:void:internal',
    'questions:read:internal',
    'questions:answer:internal',
    'bids:read:internal',
    'evaluations:read:internal',
    'awards:create:internal',
    'awards:cancel:internal',
    'awards:desert:internal',
    'files:download:internal',
    'reports:read:internal',
    'notifications:create:internal',
  ],
  AREA_SOLICITANTE: [
    'tenders:create:internal',
    'tenders:read:internal',
    'tenders:update:internal',
    'questions:read:internal',
    'evaluations:read:internal',
  ],
  EVALUADOR_TECNICO: [
    'suppliers:read:internal',
    'tenders:read:internal',
    'questions:read:internal',
    'bids:read:internal',
    'evaluations:create:internal',
    'evaluations:read:internal',
    'evaluations:update:internal',
    'files:download:internal',
  ],
  EVALUADOR_ECONOMICO: [
    'suppliers:read:internal',
    'tenders:read:internal',
    'bids:read:internal',
    'evaluations:create:internal',
    'evaluations:read:internal',
    'evaluations:update:internal',
    'files:download:internal',
  ],
  APROBADOR: [
    'suppliers:read:internal',
    'tenders:read:internal',
    'bids:read:internal',
    'evaluations:read:internal',
    'awards:create:internal',
    'awards:cancel:internal',
    'awards:desert:internal',
    'files:download:internal',
    'reports:read:internal',
  ],
  AUDITOR: [
    'users:read:internal',
    'roles:read:internal',
    'suppliers:read:internal',
    'tenders:read:internal',
    'tender-documents:read:internal',
    'questions:read:internal',
    'bids:read:internal',
    'evaluations:read:internal',
    'audit:read:internal',
    'files:download:internal',
    'reports:read:internal',
  ],
  PROVEEDOR: [
    'suppliers:read:own',
    'suppliers:update:own',
    'tenders:read:published',
    'tender-documents:read:published',
    'questions:create:own',
    'questions:read:own',
    'bids:create:own',
    'bids:read:own',
    'bids:submit:own',
    'bids:replace:own',
    'files:download:own',
    'notifications:read:own',
  ],
};

for (const codes of Object.values(rolePermissions)) {
  if (!codes.includes('auth:logout:own')) {
    codes.push('auth:logout:own');
  }
}

function parsePermission(code: string) {
  const [resource, action, scope] = code.split(':');
  return { resource, action, scope };
}

async function main() {
  const permissionRows = new Map<string, { id: string }>();

  for (const code of permissions) {
    const parsed = parsePermission(code);
    const row = await prisma.permission.upsert({
      where: { code },
      update: {
        resource: parsed.resource,
        action: parsed.action,
        scope: parsed.scope,
      },
      create: {
        code,
        resource: parsed.resource,
        action: parsed.action,
        scope: parsed.scope,
      },
      select: { id: true },
    });
    permissionRows.set(code, row);
  }

  for (const [roleName, codes] of Object.entries(rolePermissions)) {
    const role = await prisma.role.upsert({
      where: { name: roleName },
      update: { description: `Rol ${roleName}` },
      create: { name: roleName, description: `Rol ${roleName}` },
      select: { id: true },
    });

    await prisma.rolePermission.createMany({
      data: codes.map((code) => ({
        roleId: role.id,
        permissionId: permissionRows.get(code)!.id,
      })),
      skipDuplicates: true,
    });
  }

  const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@mail.com';
  const adminUsername = process.env.ADMIN_USERNAME ?? 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD ?? 'admin';
  const passwordHash = await bcrypt.hash(adminPassword, 12);
  const adminRole = await prisma.role.findUniqueOrThrow({
    where: { name: 'ADMIN' },
    select: { id: true },
  });
  const supplierRole = await prisma.role.findUniqueOrThrow({
    where: { name: 'PROVEEDOR' },
    select: { id: true },
  });

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: 'Administrador',
      username: adminUsername,
      passwordHash,
      status: 'ACTIVE',
    },
    create: {
      email: adminEmail,
      name: 'Administrador',
      username: adminUsername,
      passwordHash,
      status: 'ACTIVE',
    },
    select: { id: true },
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: admin.id,
        roleId: adminRole.id,
      },
    },
    update: {},
    create: {
      userId: admin.id,
      roleId: adminRole.id,
    },
  });

  const testUserEmail = process.env.TEST_USER_EMAIL ?? 'prueba@local.test';
  const testUsername = process.env.TEST_USER_USERNAME ?? 'prueba';
  const testUserPassword = process.env.TEST_USER_PASSWORD ?? 'admin';
  const testSupplierRuc = process.env.TEST_SUPPLIER_RUC ?? '80000000-0';
  const testSupplier = await prisma.supplier.upsert({
    where: { ruc: testSupplierRuc },
    update: {
      legalName: 'Proveedor Prueba',
      tradeName: 'Proveedor Prueba',
      contactName: 'Usuario Prueba',
      contactEmail: testUserEmail,
      status: 'ACTIVO',
      categories: ['general'],
    },
    create: {
      ruc: testSupplierRuc,
      legalName: 'Proveedor Prueba',
      tradeName: 'Proveedor Prueba',
      contactName: 'Usuario Prueba',
      contactEmail: testUserEmail,
      status: 'ACTIVO',
      categories: ['general'],
    },
    select: { id: true },
  });

  const testUser = await prisma.user.upsert({
    where: { email: testUserEmail },
    update: {
      name: 'Proveedor Prueba',
      username: testUsername,
      passwordHash: await bcrypt.hash(testUserPassword, 12),
      status: 'ACTIVE',
      supplierId: testSupplier.id,
    },
    create: {
      email: testUserEmail,
      name: 'Proveedor Prueba',
      username: testUsername,
      passwordHash: await bcrypt.hash(testUserPassword, 12),
      status: 'ACTIVE',
      supplierId: testSupplier.id,
    },
    select: { id: true },
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: testUser.id,
        roleId: supplierRole.id,
      },
    },
    update: {},
    create: {
      userId: testUser.id,
      roleId: supplierRole.id,
    },
  });

  const defaultAreas = [
    { code: 'ADM', name: 'Administracion', description: 'Area de Administracion General' },
    { code: 'FIN', name: 'Finanzas', description: 'Area de Finanzas y Contabilidad' },
    { code: 'SIS', name: 'Sistemas', description: 'Area de Sistemas y Tecnologia' },
    { code: 'COM', name: 'Compras', description: 'Area de Compras y Abastecimiento' },
    { code: 'OPE', name: 'Operaciones', description: 'Area de Operaciones' },
  ];

  for (const area of defaultAreas) {
    await prisma.requestingArea.upsert({
      where: { name: area.name },
      update: { code: area.code, description: area.description, status: 'ACTIVA', deletedAt: null },
      create: { code: area.code, name: area.name, description: area.description, status: 'ACTIVA' },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
