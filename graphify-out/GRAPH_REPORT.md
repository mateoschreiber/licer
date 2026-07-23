# Graph Report - licitaciones  (2026-07-23)

## Corpus Check
- 203 files · ~95,090 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1378 nodes · 2336 edges · 98 communities (61 shown, 37 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 18 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `0b860847`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- User Management & Audit
- Tender CRUD & DTOs
- Audit Module
- Backend Dependencies
- Frontend Dependencies
- Internal Dashboard Pages
- Requesting Areas DTOs
- Supplier Documents DTOs
- Frontend App Routing
- Awards Controller
- Bids Service & Controller
- Evaluations DTOs
- Authentication Pages
- Decorators & Permissions
- Tender Documents DTOs
- Roles DTOs
- Tender Branches
- Supplier Portal Pages
- Tender Categories
- ESLint Configuration
- Audit Logging & Notifications
- Supplier Controller & Documents
- Backend TypeScript Config
- Frontend TypeScript Config
- Auth Security Service
- Questions DTOs
- App Root Controller
- Notifications DTOs
- CI Pipeline & Docs
- File Upload/Download
- Graphify References & Hooks
- Auth Module Core
- Bids & Auth Interfaces
- Security Requirements & Audit
- Catalog Management Pages
- API Config & Auth Pages
- Auth Controller Methods
- Auth Module Structure
- Reports & Expediente
- Bids Controller Methods
- Health Check
- Backend Dev Dependencies
- Backend NPM Scripts
- Award Resolution Methods
- Docker Compose Services
- Questions Controller
- UX Verification Scripts
- App Module & HTTP Filter
- Backend Build Config
- Frontend Entry & Shared Components
- Frontend Node Config
- PhoneInput Component
- Graphify Extraction Rubric
- NestJS CLI Config
- Backend Package Metadata
- Prisma Seed Data
- JWT Auth Guard
- Password Change Guard
- Roles Guard
- Supplier Listing Methods
- Deployment & Env Security
- UX Documentation Suite
- UX Screenshots & Visual System
- Deploy Scripts
- Graphify Query System
- Permissions Guard
- Audit Interceptor
- Environment Validation
- Prisma Module
- Mobile UI Screenshots
- Preflight Script
- Rollback Script
- Docker Backend Entrypoint
- Analytics Design Reference
- Favicon Assets
- Debian Dependencies Install
- Backup Script
- Jest Config
- NestJS CLI Package
- NestJS Schematics
- NestJS Testing
- Source Map Support
- Supertest Package
- TSConfig Paths
- Bcrypt Types
- Express Types
- Nodemailer Types
- Passport JWT Types
- Supertest Types
- TypeScript Package
- Jest E2E Config
- Healthcheck Script
- URL Ingestion Reference

## God Nodes (most connected - your core abstractions)
1. `Permissions()` - 85 edges
2. `AuthenticatedUser` - 65 edges
3. `CurrentUser` - 43 edges
4. `PrismaService` - 41 edges
5. `AuditAction()` - 36 edges
6. `TendersService` - 27 edges
7. `SuppliersService` - 25 edges
8. `BidsService` - 22 edges
9. `SuppliersController` - 22 edges
10. `AuthService` - 21 edges

## Surprising Connections (you probably didn't know these)
- `Native CLAUDE.md Integration` --semantically_similar_to--> `Graphify-Aware Agent Workflow for Licer`  [INFERRED] [semantically similar]
  .codex/skills/graphify/references/hooks.md → AGENTS.md
- `.env File Permission 600 Requirement` --semantically_similar_to--> `P0: .env File Permissions (644 → 600)`  [INFERRED] [semantically similar]
  docs/DEPLOYMENT.md → REPORTE_TECNICO.md
- `JWT Fail-Fast Validation` --semantically_similar_to--> `P0: Default JWT Secrets (change-me-*)`  [INFERRED] [semantically similar]
  docs/SECURITY.md → REPORTE_TECNICO.md
- `File Upload Validation (PDF, PNG, JPEG)` --semantically_similar_to--> `P1: File Upload Accepts Client-Supplied MIME Type`  [INFERRED] [semantically similar]
  docs/SECURITY.md → REPORTE_TECNICO.md
- `Refresh Token Rotation and Revocation` --semantically_similar_to--> `P1: No Refresh Token Rotation or Revocation`  [INFERRED] [semantically similar]
  docs/SECURITY.md → REPORTE_TECNICO.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Docker Compose Service Stack** — compose_yml_postgres_service, compose_yml_backend_service, compose_yml_nginx_service, compose_yml_licer_internal_network [EXTRACTED 1.00]
- **Graphify Extraction Pipeline Components** — _codex_skills_graphify_skill_structural_extraction, _codex_skills_graphify_skill_semantic_extraction, _codex_skills_graphify_skill_community_detection, _codex_skills_graphify_skill_god_nodes, _codex_skills_graphify_skill_graph_visualization [EXTRACTED 1.00]
- **Licer Critical Security Findings (P0-P1)** — reporte_tecnico_p0_jwt_secrets, reporte_tecnico_p0_env_permissions, reporte_tecnico_p1_rate_limiting, reporte_tecnico_p1_refresh_token_rotation, reporte_tecnico_p1_password_reset_stub, reporte_tecnico_p1_tender_code_race, reporte_tecnico_p1_file_upload_mime [EXTRACTED 1.00]
- **Post-Login Internal Dashboard UI Capture** — docs_ux_screenshots_after_login_desktop_screenshot, frontend_src_shared_components_applicationshell_applicationshell, frontend_src_modules_internal_dashboard_internallayout_internallayout, lici_desktop_dashboard_view [INFERRED]
- **UX Migration Visual Evidence Chain** — docs_ux_screenshots_after_login_desktop_screenshot, docs_ux_validation_ux_migration_validation, frontend_src_styles_tokens_css_visual_system, frontend_src_styles_base_css_accessibility [INFERRED]
- **before/after UX evidence group** — docs_ux-screenshots_before_admin_suppliers_png_image, docs_ux_validation_md_doc, docs_ux_migration_plan_md_doc [INFERRED 1.00]

## Communities (98 total, 37 thin omitted)

### Community 0 - "User Management & Audit"
Cohesion: 0.05
Nodes (39): AuditController, Controller, Get, Query, AuditLogInput, AuditService, Injectable, AuditActionMetadata (+31 more)

### Community 1 - "Tender CRUD & DTOs"
Cohesion: 0.07
Nodes (19): CreateTenderDto, IsBoolean, IsDateString, IsOptional, IsString, IsUUID, CreateTenderItemDto, IsBoolean (+11 more)

### Community 2 - "Audit Module"
Cohesion: 0.33
Nodes (4): RoleCode, ROLES, SupplierOwnershipGuard, Injectable

### Community 3 - "Backend Dependencies"
Cohesion: 0.05
Nodes (39): dependencies, bcryptjs, class-transformer, class-validator, cookie-parser, @nestjs/common, @nestjs/config, @nestjs/core (+31 more)

### Community 4 - "Frontend Dependencies"
Cohesion: 0.05
Nodes (38): dependencies, libphonenumber-js, lucide-react, react, react-dom, react-hook-form, react-router-dom, @tanstack/react-query (+30 more)

### Community 5 - "Internal Dashboard Pages"
Cohesion: 0.06
Nodes (26): internalPages(), AwardResolveResponse, BidDetailInternalPage(), DecisionSuggestion, emptyTenderItem, escapePrintHtml(), getDefaultDates(), InternalBidDetail (+18 more)

### Community 6 - "Requesting Areas DTOs"
Cohesion: 0.08
Nodes (19): CreateRequestingAreaDto, IsEnum, IsOptional, IsString, MinLength, IsEnum, IsOptional, IsString (+11 more)

### Community 7 - "Supplier Documents DTOs"
Cohesion: 0.07
Nodes (26): CreateSupplierDocumentDto, IsOptional, IsString, IsUUID, CreateSupplierStaffDto, IsOptional, IsString, RegisterSupplierDto (+18 more)

### Community 8 - "Frontend App Routing"
Cohesion: 0.06
Nodes (34): AuditLogsPage, AvailableTendersPage, AwardCancelDesertPage, BidDetailInternalPage, BidsInboxPage, ChangePasswordPage, CreateBidPage, DashboardPage (+26 more)

### Community 9 - "Awards Controller"
Cohesion: 0.05
Nodes (30): AwardsController, Body, Controller, Get, Post, Query, AwardsModule, Module (+22 more)

### Community 10 - "Bids Service & Controller"
Cohesion: 0.16
Nodes (4): BidsModule, Module, BidsService, Injectable

### Community 11 - "Evaluations DTOs"
Cohesion: 0.09
Nodes (23): CreateCriteriaDto, IsEnum, IsNumber, IsOptional, IsString, IsUUID, Min, CreateScoreDto (+15 more)

### Community 12 - "Authentication Pages"
Cohesion: 0.05
Nodes (43): UX Migration Validation, ChangePasswordForm, ChangePasswordPage(), LoginForm, LoginPage(), InternalLayout(), items, items (+35 more)

### Community 13 - "Decorators & Permissions"
Cohesion: 0.17
Nodes (14): AuditAction(), Permissions(), Delete, Param, Patch, TendersController, Body, Controller (+6 more)

### Community 14 - "Tender Documents DTOs"
Cohesion: 0.10
Nodes (20): CreateTenderDocumentDto, IsDateString, IsEnum, IsOptional, IsString, IsUUID, IsString, MinLength (+12 more)

### Community 15 - "Roles DTOs"
Cohesion: 0.12
Nodes (17): CreateRoleDto, IsArray, IsOptional, IsString, IsUUID, UpdateRoleDto, RolesController, Body (+9 more)

### Community 16 - "Tender Branches"
Cohesion: 0.12
Nodes (15): CreateTenderBranchDto, IsString, MinLength, TenderBranchesController, Body, Controller, Delete, Get (+7 more)

### Community 17 - "Supplier Portal Pages"
Cohesion: 0.09
Nodes (11): supplierPages(), BidDetail, BidLine, SupplierDocumentInfo, SupplierProfileForm, SupplierProfileInfo, SupplierQuestionTicket, SupplierRegisterForm (+3 more)

### Community 18 - "Tender Categories"
Cohesion: 0.12
Nodes (15): CreateTenderCategoryDto, IsString, MinLength, TenderCategoriesController, Body, Controller, Delete, Get (+7 more)

### Community 19 - "ESLint Configuration"
Cohesion: 0.08
Nodes (25): eslint, @eslint/js, globals, devDependencies, eslint, @eslint/js, globals, prettier (+17 more)

### Community 21 - "Supplier Controller & Documents"
Cohesion: 0.15
Nodes (11): CurrentUser, Roles(), SuppliersController, Body, Controller, Delete, Get, Param (+3 more)

### Community 22 - "Backend TypeScript Config"
Cohesion: 0.09
Nodes (22): compilerOptions, allowSyntheticDefaultImports, baseUrl, declaration, emitDecoratorMetadata, experimentalDecorators, forceConsistentCasingInFileNames, incremental (+14 more)

### Community 23 - "Frontend TypeScript Config"
Cohesion: 0.09
Nodes (22): compilerOptions, allowJs, allowSyntheticDefaultImports, esModuleInterop, forceConsistentCasingInFileNames, isolatedModules, jsx, lib (+14 more)

### Community 24 - "Auth Security Service"
Cohesion: 0.06
Nodes (28): AllowBeforePasswordChange, AppModule, Module, AuthController, Controller, CurrentUser, Permissions, Post (+20 more)

### Community 26 - "Questions DTOs"
Cohesion: 0.14
Nodes (15): AnswerQuestionDto, IsString, MinLength, CreateQuestionDto, IsString, IsUUID, MinLength, QuestionsController (+7 more)

### Community 27 - "App Root Controller"
Cohesion: 0.40
Nodes (4): AppController, Controller, Get, Public()

### Community 28 - "Notifications DTOs"
Cohesion: 0.08
Nodes (20): CreateNotificationDto, IsOptional, IsString, IsUUID, NotificationsController, Body, Controller, Post (+12 more)

### Community 29 - "CI Pipeline & Docs"
Cohesion: 0.19
Nodes (15): Missing Design Token System, Monolithic Page Components (InternalPages, SupplierPages), Route and Screen Inventory (public, supplier, internal), Existing Shared Components (PageHeader, DataTable, StatusBadge), UX Audit, AppShell Shared Component, Design Tokens Phase (palette, typography, spacing), Single Icon Library Constraint (Lucide React) (+7 more)

### Community 30 - "File Upload/Download"
Cohesion: 0.08
Nodes (22): AuditModule, Module, FilesController, Controller, CurrentUser, Permissions, Post, Req (+14 more)

### Community 31 - "Graphify References & Hooks"
Cohesion: 0.10
Nodes (24): Folder Watching (--watch), Graphify Exports System (Neo4j, FalkorDB, Wiki, MCP), Confidence Score Rubric (0.55-1.0), Hyperedges for Group Relationships, Semantic Similarity Edges, Cross-Repo Graph Merge, Git Post-Commit Auto-Rebuild Hook, BFS/DFS Graph Traversal (+16 more)

### Community 32 - "Auth Module Core"
Cohesion: 0.33
Nodes (5): ResetPasswordConfirmDto, ResetPasswordRequestDto, IsEmail, IsString, MinLength

### Community 34 - "Security Requirements & Audit"
Cohesion: 0.14
Nodes (16): File Upload Validation (PDF, PNG, JPEG), JWT Fail-Fast Validation, Refresh Token Rotation and Revocation, Security Requirements, Docker Backend Image Optimization, P0: Default JWT Secrets (change-me-*), P1: File Upload Accepts Client-Supplied MIME Type, P1: Password Reset Flow is a Stub (+8 more)

### Community 38 - "Auth Module Structure"
Cohesion: 0.21
Nodes (14): CreateBidDocumentDto, CreateBidDto, CreateBidItemDto, IsArray, IsBoolean, IsNumber, IsOptional, IsString (+6 more)

### Community 39 - "Reports & Expediente"
Cohesion: 0.24
Nodes (4): DataTableColumn, DataTableProps, EmptyState(), Pagination()

### Community 40 - "Bids Controller Methods"
Cohesion: 0.16
Nodes (9): BidsController, Body, Controller, Delete, Get, Param, Post, Query (+1 more)

### Community 41 - "Health Check"
Cohesion: 0.21
Nodes (7): HealthController, Controller, Get, HealthModule, Module, HealthService, Injectable

### Community 42 - "Backend Dev Dependencies"
Cohesion: 0.15
Nodes (13): devDependencies, jest, ts-jest, @types/cookie-parser, @types/jest, @types/multer, @types/node, jest (+5 more)

### Community 43 - "Backend NPM Scripts"
Cohesion: 0.17
Nodes (12): scripts, build, dev, lint, prisma:deploy, prisma:generate, prisma:migrate, prisma:seed (+4 more)

### Community 44 - "Award Resolution Methods"
Cohesion: 0.50
Nodes (4): GitHub Actions CI Pipeline, Local Development Setup, verify-ux.mjs Automated UX Guard, pnpm Workspace (backend + frontend)

### Community 45 - "Docker Compose Services"
Cohesion: 0.20
Nodes (14): Native CLAUDE.md Integration, Graphify-Aware Agent Workflow for Licer, NestJS Backend Service, Licer Internal Docker Network, Nginx Reverse Proxy Service, PostgreSQL 16-alpine Service, Docker Service Healthchecks, React SPA HTML Entry Point (+6 more)

### Community 46 - "Questions Controller"
Cohesion: 0.20
Nodes (5): AuthenticatedUser, Get, Get, Param, Query

### Community 47 - "UX Verification Scripts"
Cohesion: 0.18
Nodes (9): app, componentStyles, errors, frontend, requiredFiles, requiredRoutes, root, sourceFiles (+1 more)

### Community 49 - "Backend Build Config"
Cohesion: 0.25
Nodes (7): exclude, extends, dist, node_modules, **/*.spec.ts, test, ./tsconfig.json

### Community 50 - "Frontend Entry & Shared Components"
Cohesion: 0.24
Nodes (7): App(), queryClient, ConfirmationRequest, FeedbackHost(), FeedbackTone, notify(), ToastMessage

### Community 51 - "Frontend Node Config"
Cohesion: 0.25
Nodes (7): compilerOptions, allowSyntheticDefaultImports, composite, module, moduleResolution, include, vite.config.ts

### Community 52 - "PhoneInput Component"
Cohesion: 0.38
Nodes (6): countries, displayNames, nationalNumber(), PhoneInput(), PhoneInputProps, validCountry()

### Community 53 - "Graphify Extraction Rubric"
Cohesion: 0.50
Nodes (3): ChangePasswordDto, IsString, MinLength

### Community 54 - "NestJS CLI Config"
Cohesion: 0.33
Nodes (5): collection, compilerOptions, deleteOutDir, $schema, sourceRoot

### Community 55 - "Backend Package Metadata"
Cohesion: 0.33
Nodes (5): name, prisma, seed, private, version

### Community 56 - "Prisma Seed Data"
Cohesion: 0.40
Nodes (5): main(), parsePermission(), permissions, prisma, rolePermissions

### Community 61 - "Deployment & Env Security"
Cohesion: 0.33
Nodes (6): Docker Deployment Flow, .env File Permission 600 Requirement, JWT Secret Generation (>=32 chars), Docker Compose Deployment, P0: .env File Permissions (644 → 600), Debian Deployment Scripts

### Community 64 - "Deploy Scripts"
Cohesion: 0.53
Nodes (4): fail(), info(), set_env(), 02-deploy-compose.sh script

### Community 70 - "Mobile UI Screenshots"
Cohesion: 0.50
Nodes (3): Authenticated Application State, Mobile Layout, After Login Screen (Mobile)

### Community 71 - "Preflight Script"
Cohesion: 0.83
Nodes (3): fail(), info(), 00-preflight.sh script

### Community 72 - "Rollback Script"
Cohesion: 0.83
Nodes (3): fail(), info(), 05-rollback-last.sh script

### Community 76 - "Analytics Design Reference"
Cohesion: 0.67
Nodes (3): Analytics Module UX Design, Analytics UX Reference (Design Screenshot/Mockup), Licitaciones Dashboard (Tender/Bid Analytics)

## Knowledge Gaps
- **296 isolated node(s):** `name`, `version`, `private`, `build`, `dev` (+291 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **37 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Permissions()` connect `Decorators & Permissions` to `User Management & Audit`, `Tender CRUD & DTOs`, `Requesting Areas DTOs`, `Supplier Documents DTOs`, `Bids Controller Methods`, `Awards Controller`, `Evaluations DTOs`, `Questions Controller`, `Roles DTOs`, `Tender Branches`, `Tender Documents DTOs`, `Tender Categories`, `Supplier Controller & Documents`, `Questions DTOs`, `Notifications DTOs`?**
  _High betweenness centrality (0.098) - this node is a cross-community bridge._
- **Why does `AuthenticatedUser` connect `Questions Controller` to `Bids & Auth Interfaces`, `Tender CRUD & DTOs`, `Supplier Documents DTOs`, `Bids Controller Methods`, `Awards Controller`, `Evaluations DTOs`, `Decorators & Permissions`, `Tender Documents DTOs`, `Supplier Controller & Documents`, `Questions DTOs`, `Notifications DTOs`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **Why does `PrismaService` connect `Awards Controller` to `User Management & Audit`, `Requesting Areas DTOs`, `Health Check`, `Evaluations DTOs`, `Tender Documents DTOs`, `Roles DTOs`, `Tender Branches`, `Tender Categories`, `Questions DTOs`, `Notifications DTOs`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _296 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `User Management & Audit` be split into smaller, more focused modules?**
  _Cohesion score 0.05128205128205128 - nodes in this community are weakly interconnected._
- **Should `Tender CRUD & DTOs` be split into smaller, more focused modules?**
  _Cohesion score 0.07493061979648474 - nodes in this community are weakly interconnected._
- **Should `Backend Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.05128205128205128 - nodes in this community are weakly interconnected._