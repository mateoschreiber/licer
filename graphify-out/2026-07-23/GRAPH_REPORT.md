# Graph Report - .  (2026-07-23)

## Corpus Check
- 212 files · ~95,090 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1370 nodes · 2733 edges · 100 communities (70 shown, 30 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 18 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

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
- Internal Dashboard Detail Pages
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
- Supplier Ownership Guard
- Tender Documents Listing
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
1. `AuthenticatedUser` - 108 edges
2. `Permissions()` - 91 edges
3. `PrismaService` - 62 edges
4. `CurrentUser` - 49 edges
5. `AuditAction()` - 36 edges
6. `PaginationDto` - 27 edges
7. `TendersService` - 27 edges
8. `SuppliersService` - 25 edges
9. `BidsService` - 22 edges
10. `SuppliersController` - 22 edges

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

## Communities (100 total, 30 thin omitted)

### Community 0 - "User Management & Audit"
Cohesion: 0.07
Nodes (29): Get, Query, PaginationDto, IsOptional, IsString, Min, Type, CreateUserDto (+21 more)

### Community 1 - "Tender CRUD & DTOs"
Cohesion: 0.09
Nodes (18): CreateTenderDto, IsBoolean, IsDateString, IsOptional, IsString, IsUUID, CreateTenderItemDto, IsBoolean (+10 more)

### Community 2 - "Audit Module"
Cohesion: 0.08
Nodes (16): AuditController, Controller, AuditLogInput, AuditService, Injectable, internalUser, supplierUser, RoleCode (+8 more)

### Community 3 - "Backend Dependencies"
Cohesion: 0.05
Nodes (39): dependencies, bcryptjs, class-transformer, class-validator, cookie-parser, @nestjs/common, @nestjs/config, @nestjs/core (+31 more)

### Community 4 - "Frontend Dependencies"
Cohesion: 0.05
Nodes (38): dependencies, libphonenumber-js, lucide-react, react, react-dom, react-hook-form, react-router-dom, @tanstack/react-query (+30 more)

### Community 5 - "Internal Dashboard Pages"
Cohesion: 0.07
Nodes (29): AwardResolveResponse, DecisionSuggestion, emptyTenderItem, escapePrintHtml(), getDefaultDates(), InternalBidDetail, QuestionsInboxPage(), QuestionTicket (+21 more)

### Community 6 - "Requesting Areas DTOs"
Cohesion: 0.09
Nodes (19): CreateRequestingAreaDto, IsEnum, IsOptional, IsString, MinLength, IsEnum, IsOptional, IsString (+11 more)

### Community 7 - "Supplier Documents DTOs"
Cohesion: 0.09
Nodes (26): CreateSupplierDocumentDto, IsOptional, IsString, IsUUID, CreateSupplierStaffDto, IsOptional, IsString, RegisterSupplierDto (+18 more)

### Community 8 - "Frontend App Routing"
Cohesion: 0.06
Nodes (35): AuditLogsPage, AvailableTendersPage, AwardCancelDesertPage, BidDetailInternalPage, BidsInboxPage, ChangePasswordPage, CreateBidPage, DashboardPage (+27 more)

### Community 9 - "Awards Controller"
Cohesion: 0.09
Nodes (16): AwardsController, Controller, Get, Query, AwardsModule, Module, AwardsService, adminUser (+8 more)

### Community 10 - "Bids Service & Controller"
Cohesion: 0.11
Nodes (16): BidsService, Injectable, CreateBidDocumentDto, CreateBidDto, CreateBidItemDto, IsArray, IsBoolean, IsNumber (+8 more)

### Community 11 - "Evaluations DTOs"
Cohesion: 0.09
Nodes (23): CreateCriteriaDto, IsEnum, IsNumber, IsOptional, IsString, IsUUID, Min, CreateScoreDto (+15 more)

### Community 12 - "Authentication Pages"
Cohesion: 0.11
Nodes (23): ChangePasswordForm, ChangePasswordPage(), LoginForm, LoginPage(), InternalLayout(), items, items, SupplierLayout() (+15 more)

### Community 13 - "Decorators & Permissions"
Cohesion: 0.13
Nodes (14): AuditAction(), Permissions(), Delete, Param, Patch, TendersController, Body, Controller (+6 more)

### Community 14 - "Tender Documents DTOs"
Cohesion: 0.11
Nodes (18): CreateTenderDocumentDto, IsDateString, IsEnum, IsOptional, IsString, IsUUID, IsString, MinLength (+10 more)

### Community 15 - "Roles DTOs"
Cohesion: 0.12
Nodes (17): CreateRoleDto, IsArray, IsOptional, IsString, IsUUID, UpdateRoleDto, RolesController, Body (+9 more)

### Community 16 - "Tender Branches"
Cohesion: 0.12
Nodes (15): CreateTenderBranchDto, IsString, MinLength, TenderBranchesController, Body, Controller, Delete, Get (+7 more)

### Community 17 - "Supplier Portal Pages"
Cohesion: 0.09
Nodes (23): supplierPages(), BidDetail, BidLine, QuestionsAnswersPage(), SubmissionReceiptPage(), SupplierDocumentInfo, SupplierProfileForm, SupplierProfileInfo (+15 more)

### Community 18 - "Tender Categories"
Cohesion: 0.12
Nodes (15): CreateTenderCategoryDto, IsString, MinLength, TenderCategoriesController, Body, Controller, Delete, Get (+7 more)

### Community 19 - "ESLint Configuration"
Cohesion: 0.08
Nodes (25): eslint, @eslint/js, globals, devDependencies, eslint, @eslint/js, globals, prettier (+17 more)

### Community 20 - "Audit Logging & Notifications"
Cohesion: 0.20
Nodes (4): AuthenticatedUser, Get, SuppliersService, Injectable

### Community 21 - "Supplier Controller & Documents"
Cohesion: 0.27
Nodes (9): CurrentUser, Roles(), SuppliersController, Body, Controller, Delete, Param, Patch (+1 more)

### Community 22 - "Backend TypeScript Config"
Cohesion: 0.09
Nodes (22): compilerOptions, allowSyntheticDefaultImports, baseUrl, declaration, emitDecoratorMetadata, experimentalDecorators, forceConsistentCasingInFileNames, incremental (+14 more)

### Community 23 - "Frontend TypeScript Config"
Cohesion: 0.09
Nodes (22): compilerOptions, allowJs, allowSyntheticDefaultImports, esModuleInterop, forceConsistentCasingInFileNames, isolatedModules, jsx, lib (+14 more)

### Community 24 - "Auth Security Service"
Cohesion: 0.18
Nodes (4): AuthSecurityService, Injectable, AuthService, Injectable

### Community 25 - "Internal Dashboard Detail Pages"
Cohesion: 0.19
Nodes (20): AwardCancelDesertPage(), BidDetailInternalPage(), BidsInboxPage(), previewBidA4(), previewTenderA4(), QuestionDetailInternalPage(), TenderDetailInternalPage(), TendersManagementPage() (+12 more)

### Community 26 - "Questions DTOs"
Cohesion: 0.16
Nodes (13): AnswerQuestionDto, IsString, MinLength, CreateQuestionDto, IsString, IsUUID, MinLength, QuestionsController (+5 more)

### Community 27 - "App Root Controller"
Cohesion: 0.13
Nodes (15): AppController, Controller, Get, AuditModule, Module, AuthModule, Module, BidsModule (+7 more)

### Community 28 - "Notifications DTOs"
Cohesion: 0.16
Nodes (12): CreateNotificationDto, IsOptional, IsString, IsUUID, NotificationsController, Body, Controller, Post (+4 more)

### Community 29 - "CI Pipeline & Docs"
Cohesion: 0.14
Nodes (19): GitHub Actions CI Pipeline, Local Development Setup, Missing Design Token System, Monolithic Page Components (InternalPages, SupplierPages), Route and Screen Inventory (public, supplier, internal), Existing Shared Components (PageHeader, DataTable, StatusBadge), UX Audit, AppShell Shared Component (+11 more)

### Community 30 - "File Upload/Download"
Cohesion: 0.13
Nodes (11): FilesController, Controller, Get, Param, Post, Req, Res, FilesService (+3 more)

### Community 31 - "Graphify References & Hooks"
Cohesion: 0.13
Nodes (16): Folder Watching (--watch), Graphify Exports System (Neo4j, FalkorDB, Wiki, MCP), Cross-Repo Graph Merge, Native CLAUDE.md Integration, Git Post-Commit Auto-Rebuild Hook, Whisper Video/Audio Transcription, Build Merge for Incremental Updates, Cluster-Only Rebuild Mode (+8 more)

### Community 32 - "Auth Module Core"
Cohesion: 0.22
Nodes (10): ChangePasswordDto, IsString, MinLength, LoginDto, IsString, ResetPasswordConfirmDto, ResetPasswordRequestDto, IsEmail (+2 more)

### Community 34 - "Security Requirements & Audit"
Cohesion: 0.14
Nodes (16): File Upload Validation (PDF, PNG, JPEG), JWT Fail-Fast Validation, Refresh Token Rotation and Revocation, Security Requirements, Docker Backend Image Optimization, P0: Default JWT Secrets (change-me-*), P1: File Upload Accepts Client-Supplied MIME Type, P1: Password Reset Flow is a Stub (+8 more)

### Community 35 - "Catalog Management Pages"
Cohesion: 0.15
Nodes (12): catalogPages(), CatalogItem, CatalogManagementPage(), RequestingAreasPage(), SupplierDetailPage(), SupplierDocumentsPage(), SupplierProfilePage(), previewFile() (+4 more)

### Community 36 - "API Config & Auth Pages"
Cohesion: 0.16
Nodes (9): ResetForm, TenderDocumentsPage(), api, ApiError, apiRequest(), downloadFile(), getToken(), SupplierOption (+1 more)

### Community 37 - "Auth Controller Methods"
Cohesion: 0.31
Nodes (8): AuthController, Body, Controller, Post, Req, Res, AllowBeforePasswordChange(), Public()

### Community 38 - "Auth Module Structure"
Cohesion: 0.16
Nodes (5): JwtPayload, JwtStrategy, Injectable, PasswordResetMailerService, Injectable

### Community 39 - "Reports & Expediente"
Cohesion: 0.19
Nodes (8): ReportsController, Controller, Get, Param, ReportsModule, Module, ReportsService, Injectable

### Community 40 - "Bids Controller Methods"
Cohesion: 0.19
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
Cohesion: 0.27
Nodes (6): Body, Post, DecisionDto, IsString, IsUUID, MinLength

### Community 45 - "Docker Compose Services"
Cohesion: 0.24
Nodes (12): NestJS Backend Service, Licer Internal Docker Network, Nginx Reverse Proxy Service, PostgreSQL 16-alpine Service, Docker Service Healthchecks, React SPA HTML Entry Point, Licer - Private Tenders Portal, NestJS Backend Framework (+4 more)

### Community 46 - "Questions Controller"
Cohesion: 0.20
Nodes (5): Body, Get, Param, Post, Query

### Community 47 - "UX Verification Scripts"
Cohesion: 0.18
Nodes (9): app, componentStyles, errors, frontend, requiredFiles, requiredRoutes, root, sourceFiles (+1 more)

### Community 48 - "App Module & HTTP Filter"
Cohesion: 0.31
Nodes (6): AppModule, Module, HttpExceptionFilter, bootstrap(), parseAllowedOrigins(), Catch

### Community 49 - "Backend Build Config"
Cohesion: 0.25
Nodes (7): exclude, extends, dist, node_modules, **/*.spec.ts, test, ./tsconfig.json

### Community 50 - "Frontend Entry & Shared Components"
Cohesion: 0.29
Nodes (6): App(), queryClient, ConfirmationRequest, FeedbackHost(), FeedbackTone, ToastMessage

### Community 51 - "Frontend Node Config"
Cohesion: 0.25
Nodes (7): compilerOptions, allowSyntheticDefaultImports, composite, module, moduleResolution, include, vite.config.ts

### Community 52 - "PhoneInput Component"
Cohesion: 0.38
Nodes (6): countries, displayNames, nationalNumber(), PhoneInput(), PhoneInputProps, validCountry()

### Community 53 - "Graphify Extraction Rubric"
Cohesion: 0.33
Nodes (6): Confidence Score Rubric (0.55-1.0), Hyperedges for Group Relationships, Semantic Similarity Edges, Parallel Subagent Dispatch for Semantic Extraction, Gemini LLM Backend for Semantic Extraction, Semantic Extraction (Part B)

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

### Community 63 - "UX Screenshots & Visual System"
Cohesion: 0.47
Nodes (4): UX Migration Validation, Base CSS, Design Tokens CSS, Desktop Dashboard View

### Community 64 - "Deploy Scripts"
Cohesion: 0.53
Nodes (4): fail(), info(), set_env(), 02-deploy-compose.sh script

### Community 65 - "Graphify Query System"
Cohesion: 0.50
Nodes (4): BFS/DFS Graph Traversal, Constrained Query Expansion, Reflect Lessons Self-Improving Loop, Save-Result Feedback Loop

### Community 68 - "Environment Validation"
Cohesion: 0.67
Nodes (3): insecureValues, requireSecret(), validateEnvironment()

### Community 69 - "Prisma Module"
Cohesion: 0.50
Nodes (3): PrismaModule, Module, Global

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
- **293 isolated node(s):** `config`, `$schema`, `collection`, `sourceRoot`, `deleteOutDir` (+288 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **30 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Permissions()` connect `Decorators & Permissions` to `User Management & Audit`, `Tender CRUD & DTOs`, `Audit Module`, `Requesting Areas DTOs`, `Supplier Documents DTOs`, `Awards Controller`, `Evaluations DTOs`, `Tender Documents DTOs`, `Roles DTOs`, `Tender Branches`, `Tender Categories`, `Audit Logging & Notifications`, `Supplier Controller & Documents`, `Questions DTOs`, `Notifications DTOs`, `File Upload/Download`, `Auth Module Core`, `Bids & Auth Interfaces`, `Auth Controller Methods`, `Reports & Expediente`, `Bids Controller Methods`, `Award Resolution Methods`, `Questions Controller`, `Supplier Listing Methods`, `Tender Documents Listing`?**
  _High betweenness centrality (0.104) - this node is a cross-community bridge._
- **Why does `AuthenticatedUser` connect `Audit Logging & Notifications` to `Tender CRUD & DTOs`, `Audit Module`, `Supplier Documents DTOs`, `Awards Controller`, `Bids Service & Controller`, `Evaluations DTOs`, `Decorators & Permissions`, `Tender Documents DTOs`, `Supplier Controller & Documents`, `Auth Security Service`, `Questions DTOs`, `Notifications DTOs`, `File Upload/Download`, `Auth Module Core`, `Bids & Auth Interfaces`, `Auth Controller Methods`, `Auth Module Structure`, `Bids Controller Methods`, `Award Resolution Methods`, `Questions Controller`, `Supplier Listing Methods`, `Tender Documents Listing`?**
  _High betweenness centrality (0.056) - this node is a cross-community bridge._
- **Why does `PrismaService` connect `Audit Module` to `User Management & Audit`, `Tender CRUD & DTOs`, `Requesting Areas DTOs`, `Supplier Documents DTOs`, `Awards Controller`, `Evaluations DTOs`, `Tender Documents DTOs`, `Roles DTOs`, `Tender Branches`, `Tender Categories`, `Audit Logging & Notifications`, `Auth Security Service`, `Questions DTOs`, `Notifications DTOs`, `File Upload/Download`, `Auth Module Core`, `Auth Module Structure`, `Reports & Expediente`, `Health Check`, `Award Resolution Methods`, `Prisma Module`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **What connects `config`, `$schema`, `collection` to the rest of the system?**
  _293 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `User Management & Audit` be split into smaller, more focused modules?**
  _Cohesion score 0.07053140096618357 - nodes in this community are weakly interconnected._
- **Should `Tender CRUD & DTOs` be split into smaller, more focused modules?**
  _Cohesion score 0.08888888888888889 - nodes in this community are weakly interconnected._
- **Should `Audit Module` be split into smaller, more focused modules?**
  _Cohesion score 0.07973421926910298 - nodes in this community are weakly interconnected._