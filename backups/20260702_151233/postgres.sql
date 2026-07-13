--
-- PostgreSQL database dump
--

\restrict P4aebuH40cZMIHhrtJ2X8Ls5L2lagpLCJE16AQ52hOCyUWKv6i8fFBitzmuHNnD

-- Dumped from database version 16.14
-- Dumped by pg_dump version 16.14

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: AuditResult; Type: TYPE; Schema: public; Owner: licer
--

CREATE TYPE public."AuditResult" AS ENUM (
    'ALLOWED',
    'DENIED',
    'ERROR'
);


ALTER TYPE public."AuditResult" OWNER TO licer;

--
-- Name: AwardStatus; Type: TYPE; Schema: public; Owner: licer
--

CREATE TYPE public."AwardStatus" AS ENUM (
    'ADJUDICADA',
    'CANCELADA',
    'DESIERTA'
);


ALTER TYPE public."AwardStatus" OWNER TO licer;

--
-- Name: BidStatus; Type: TYPE; Schema: public; Owner: licer
--

CREATE TYPE public."BidStatus" AS ENUM (
    'BORRADOR',
    'ENVIADA',
    'REEMPLAZADA',
    'ANULADA',
    'EVALUADA'
);


ALTER TYPE public."BidStatus" OWNER TO licer;

--
-- Name: DocumentStatus; Type: TYPE; Schema: public; Owner: licer
--

CREATE TYPE public."DocumentStatus" AS ENUM (
    'PENDIENTE',
    'APROBADO',
    'OBSERVADO',
    'VENCIDO',
    'ANULADO'
);


ALTER TYPE public."DocumentStatus" OWNER TO licer;

--
-- Name: EvaluationCategory; Type: TYPE; Schema: public; Owner: licer
--

CREATE TYPE public."EvaluationCategory" AS ENUM (
    'DOCUMENTAL',
    'TECNICA',
    'ECONOMICA'
);


ALTER TYPE public."EvaluationCategory" OWNER TO licer;

--
-- Name: NotificationStatus; Type: TYPE; Schema: public; Owner: licer
--

CREATE TYPE public."NotificationStatus" AS ENUM (
    'PENDING',
    'SENT',
    'FAILED',
    'READ'
);


ALTER TYPE public."NotificationStatus" OWNER TO licer;

--
-- Name: QuestionStatus; Type: TYPE; Schema: public; Owner: licer
--

CREATE TYPE public."QuestionStatus" AS ENUM (
    'PENDIENTE',
    'RESPONDIDA',
    'RECHAZADA',
    'ANULADA'
);


ALTER TYPE public."QuestionStatus" OWNER TO licer;

--
-- Name: RequestingAreaStatus; Type: TYPE; Schema: public; Owner: licer
--

CREATE TYPE public."RequestingAreaStatus" AS ENUM (
    'ACTIVA',
    'INACTIVA'
);


ALTER TYPE public."RequestingAreaStatus" OWNER TO licer;

--
-- Name: SupplierStatus; Type: TYPE; Schema: public; Owner: licer
--

CREATE TYPE public."SupplierStatus" AS ENUM (
    'PENDIENTE',
    'ACTIVO',
    'OBSERVADO',
    'BLOQUEADO',
    'INACTIVO'
);


ALTER TYPE public."SupplierStatus" OWNER TO licer;

--
-- Name: TenderDocumentType; Type: TYPE; Schema: public; Owner: licer
--

CREATE TYPE public."TenderDocumentType" AS ENUM (
    'BASE',
    'ANEXO',
    'ADDENDA',
    'CONDICION',
    'TECNICO'
);


ALTER TYPE public."TenderDocumentType" OWNER TO licer;

--
-- Name: TenderStatus; Type: TYPE; Schema: public; Owner: licer
--

CREATE TYPE public."TenderStatus" AS ENUM (
    'BORRADOR',
    'REVISION',
    'PUBLICADA',
    'CONSULTAS_CERRADAS',
    'RECEPCION',
    'CERRADA',
    'EVALUACION',
    'ADJUDICADA',
    'CANCELADA',
    'DESIERTA',
    'ARCHIVADA'
);


ALTER TYPE public."TenderStatus" OWNER TO licer;

--
-- Name: UserStatus; Type: TYPE; Schema: public; Owner: licer
--

CREATE TYPE public."UserStatus" AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'BLOCKED'
);


ALTER TYPE public."UserStatus" OWNER TO licer;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Answer; Type: TABLE; Schema: public; Owner: licer
--

CREATE TABLE public."Answer" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "questionId" uuid,
    "tenderId" uuid NOT NULL,
    text text NOT NULL,
    "publishedAt" timestamp(3) without time zone,
    "authorId" uuid NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "voidedAt" timestamp(3) without time zone
);


ALTER TABLE public."Answer" OWNER TO licer;

--
-- Name: AuditLog; Type: TABLE; Schema: public; Owner: licer
--

CREATE TABLE public."AuditLog" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "actorId" uuid,
    role text,
    ip text,
    action text NOT NULL,
    entity text NOT NULL,
    "entityId" text,
    result public."AuditResult" NOT NULL,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."AuditLog" OWNER TO licer;

--
-- Name: Award; Type: TABLE; Schema: public; Owner: licer
--

CREATE TABLE public."Award" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "tenderId" uuid NOT NULL,
    "supplierId" uuid,
    "bidId" uuid,
    amount numeric(18,2),
    status public."AwardStatus" NOT NULL,
    reason text NOT NULL,
    "approvedById" uuid NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "deletedAt" timestamp(3) without time zone
);


ALTER TABLE public."Award" OWNER TO licer;

--
-- Name: Bid; Type: TABLE; Schema: public; Owner: licer
--

CREATE TABLE public."Bid" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "tenderId" uuid NOT NULL,
    "supplierId" uuid NOT NULL,
    "userId" uuid NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    status public."BidStatus" DEFAULT 'BORRADOR'::public."BidStatus" NOT NULL,
    "submittedAt" timestamp(3) without time zone,
    "replacedById" uuid,
    "totalAmount" numeric(18,2),
    currency text DEFAULT 'PYG'::text NOT NULL,
    "validityDays" integer,
    "paymentTerms" text,
    "deliveryTerms" text,
    "receiptCode" text,
    "voidedAt" timestamp(3) without time zone,
    "voidReason" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "deletedAt" timestamp(3) without time zone
);


ALTER TABLE public."Bid" OWNER TO licer;

--
-- Name: BidDocument; Type: TABLE; Schema: public; Owner: licer
--

CREATE TABLE public."BidDocument" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "bidId" uuid NOT NULL,
    "fileId" uuid NOT NULL,
    type text NOT NULL,
    "uploadedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "voidedAt" timestamp(3) without time zone,
    "voidReason" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."BidDocument" OWNER TO licer;

--
-- Name: BidItem; Type: TABLE; Schema: public; Owner: licer
--

CREATE TABLE public."BidItem" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "bidId" uuid NOT NULL,
    "tenderItemId" uuid,
    quantity numeric(18,4) NOT NULL,
    "unitPrice" numeric(18,2) NOT NULL,
    tax numeric(18,2) DEFAULT 0 NOT NULL,
    total numeric(18,2) NOT NULL,
    "brandModel" text,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "deletedAt" timestamp(3) without time zone
);


ALTER TABLE public."BidItem" OWNER TO licer;

--
-- Name: EvaluationCriteria; Type: TABLE; Schema: public; Owner: licer
--

CREATE TABLE public."EvaluationCriteria" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "tenderId" uuid NOT NULL,
    category public."EvaluationCategory" NOT NULL,
    name text NOT NULL,
    description text,
    weight numeric(8,2) NOT NULL,
    "maxScore" numeric(8,2) NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "deletedAt" timestamp(3) without time zone
);


ALTER TABLE public."EvaluationCriteria" OWNER TO licer;

--
-- Name: EvaluationScore; Type: TABLE; Schema: public; Owner: licer
--

CREATE TABLE public."EvaluationScore" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "bidId" uuid NOT NULL,
    "criteriaId" uuid NOT NULL,
    "evaluatorId" uuid NOT NULL,
    score numeric(8,2) NOT NULL,
    comment text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "deletedAt" timestamp(3) without time zone
);


ALTER TABLE public."EvaluationScore" OWNER TO licer;

--
-- Name: FileObject; Type: TABLE; Schema: public; Owner: licer
--

CREATE TABLE public."FileObject" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "storagePath" text NOT NULL,
    "originalName" text NOT NULL,
    mime text NOT NULL,
    size bigint NOT NULL,
    sha256 text NOT NULL,
    "uploadedById" uuid NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "deletedAt" timestamp(3) without time zone
);


ALTER TABLE public."FileObject" OWNER TO licer;

--
-- Name: Notification; Type: TABLE; Schema: public; Owner: licer
--

CREATE TABLE public."Notification" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "userId" uuid,
    "supplierId" uuid,
    "tenderId" uuid,
    channel text NOT NULL,
    subject text NOT NULL,
    body text NOT NULL,
    status public."NotificationStatus" DEFAULT 'PENDING'::public."NotificationStatus" NOT NULL,
    metadata jsonb,
    "readAt" timestamp(3) without time zone,
    "sentAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "deletedAt" timestamp(3) without time zone
);


ALTER TABLE public."Notification" OWNER TO licer;

--
-- Name: Permission; Type: TABLE; Schema: public; Owner: licer
--

CREATE TABLE public."Permission" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code text NOT NULL,
    resource text NOT NULL,
    action text NOT NULL,
    scope text NOT NULL,
    description text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Permission" OWNER TO licer;

--
-- Name: Question; Type: TABLE; Schema: public; Owner: licer
--

CREATE TABLE public."Question" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "tenderId" uuid NOT NULL,
    "supplierId" uuid NOT NULL,
    "userId" uuid NOT NULL,
    text text NOT NULL,
    status public."QuestionStatus" DEFAULT 'PENDIENTE'::public."QuestionStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "deletedAt" timestamp(3) without time zone
);


ALTER TABLE public."Question" OWNER TO licer;

--
-- Name: RequestingArea; Type: TABLE; Schema: public; Owner: licer
--

CREATE TABLE public."RequestingArea" (
    id uuid NOT NULL,
    code text,
    name text NOT NULL,
    description text,
    status public."RequestingAreaStatus" DEFAULT 'ACTIVA'::public."RequestingAreaStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone
);


ALTER TABLE public."RequestingArea" OWNER TO licer;

--
-- Name: Role; Type: TABLE; Schema: public; Owner: licer
--

CREATE TABLE public."Role" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Role" OWNER TO licer;

--
-- Name: RolePermission; Type: TABLE; Schema: public; Owner: licer
--

CREATE TABLE public."RolePermission" (
    "roleId" uuid NOT NULL,
    "permissionId" uuid NOT NULL
);


ALTER TABLE public."RolePermission" OWNER TO licer;

--
-- Name: Supplier; Type: TABLE; Schema: public; Owner: licer
--

CREATE TABLE public."Supplier" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ruc text NOT NULL,
    "legalName" text NOT NULL,
    "tradeName" text,
    "contactName" text NOT NULL,
    "contactEmail" text NOT NULL,
    phone text,
    address text,
    categories text[] DEFAULT ARRAY[]::text[],
    status public."SupplierStatus" DEFAULT 'PENDIENTE'::public."SupplierStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "deletedAt" timestamp(3) without time zone
);


ALTER TABLE public."Supplier" OWNER TO licer;

--
-- Name: SupplierDocument; Type: TABLE; Schema: public; Owner: licer
--

CREATE TABLE public."SupplierDocument" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "supplierId" uuid NOT NULL,
    type text NOT NULL,
    "fileId" uuid NOT NULL,
    status public."DocumentStatus" DEFAULT 'PENDIENTE'::public."DocumentStatus" NOT NULL,
    "expiresAt" timestamp(3) without time zone,
    "voidedAt" timestamp(3) without time zone,
    "voidReason" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "deletedAt" timestamp(3) without time zone
);


ALTER TABLE public."SupplierDocument" OWNER TO licer;

--
-- Name: Tender; Type: TABLE; Schema: public; Owner: licer
--

CREATE TABLE public."Tender" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code text NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    status public."TenderStatus" DEFAULT 'BORRADOR'::public."TenderStatus" NOT NULL,
    currency text DEFAULT 'PYG'::text NOT NULL,
    "buyerId" uuid,
    "requesterArea" text,
    "allowBidReplacement" boolean DEFAULT true NOT NULL,
    "publishedAt" timestamp(3) without time zone,
    "questionDeadline" timestamp(3) without time zone,
    "bidDeadline" timestamp(3) without time zone NOT NULL,
    "evaluationStart" timestamp(3) without time zone,
    "estimatedAwardAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "deletedAt" timestamp(3) without time zone,
    "requestingAreaId" uuid
);


ALTER TABLE public."Tender" OWNER TO licer;

--
-- Name: TenderDocument; Type: TABLE; Schema: public; Owner: licer
--

CREATE TABLE public."TenderDocument" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "tenderId" uuid NOT NULL,
    type public."TenderDocumentType" NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    title text NOT NULL,
    "fileId" uuid NOT NULL,
    "publishedAt" timestamp(3) without time zone,
    "voidedAt" timestamp(3) without time zone,
    "voidReason" text,
    "createdById" uuid,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."TenderDocument" OWNER TO licer;

--
-- Name: TenderItem; Type: TABLE; Schema: public; Owner: licer
--

CREATE TABLE public."TenderItem" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "tenderId" uuid NOT NULL,
    lot text,
    description text NOT NULL,
    unit text NOT NULL,
    quantity numeric(18,4) NOT NULL,
    specs text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "deletedAt" timestamp(3) without time zone
);


ALTER TABLE public."TenderItem" OWNER TO licer;

--
-- Name: User; Type: TABLE; Schema: public; Owner: licer
--

CREATE TABLE public."User" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email text NOT NULL,
    "passwordHash" text NOT NULL,
    name text NOT NULL,
    status public."UserStatus" DEFAULT 'ACTIVE'::public."UserStatus" NOT NULL,
    "supplierId" uuid,
    "lastLoginAt" timestamp(3) without time zone,
    "failedLoginCount" integer DEFAULT 0 NOT NULL,
    "lockedUntil" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "deletedAt" timestamp(3) without time zone
);


ALTER TABLE public."User" OWNER TO licer;

--
-- Name: UserRole; Type: TABLE; Schema: public; Owner: licer
--

CREATE TABLE public."UserRole" (
    "userId" uuid NOT NULL,
    "roleId" uuid NOT NULL,
    "assignedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."UserRole" OWNER TO licer;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: licer
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO licer;

--
-- Data for Name: Answer; Type: TABLE DATA; Schema: public; Owner: licer
--

COPY public."Answer" (id, "questionId", "tenderId", text, "publishedAt", "authorId", "createdAt", "updatedAt", "voidedAt") FROM stdin;
\.


--
-- Data for Name: AuditLog; Type: TABLE DATA; Schema: public; Owner: licer
--

COPY public."AuditLog" (id, "actorId", role, ip, action, entity, "entityId", result, metadata, "createdAt", "updatedAt") FROM stdin;
2ad8468e-62ec-45b3-99ee-6e6d8f18dd07	f8d15787-d49a-4c04-9dce-e912e570d3d4	ADMIN	172.18.0.4	LOGIN_SUCCESS	User	f8d15787-d49a-4c04-9dce-e912e570d3d4	ALLOWED	\N	2026-07-02 16:20:20.076	2026-07-02 16:20:20.076
5f93c4c8-403a-4848-babf-73b5815f4b10	865de70c-72a5-494a-80cc-89ed9aa31270	PROVEEDOR	172.18.0.4	LOGIN_SUCCESS	User	865de70c-72a5-494a-80cc-89ed9aa31270	ALLOWED	\N	2026-07-02 16:20:20.798	2026-07-02 16:20:20.798
8b25d812-1ca9-4544-8a93-5edd8e6a3df5	\N	\N	172.18.0.4	LOGIN_FAILED	User	\N	DENIED	{"email": "admin@mail.com"}	2026-07-02 16:25:23.695	2026-07-02 16:25:23.695
79934e24-7372-4cea-9141-361e29f80c7f	f8d15787-d49a-4c04-9dce-e912e570d3d4	ADMIN	172.18.0.4	LOGIN_SUCCESS	User	f8d15787-d49a-4c04-9dce-e912e570d3d4	ALLOWED	\N	2026-07-02 16:26:00.397	2026-07-02 16:26:00.397
f02b4ea2-46fa-4b36-8150-9467ef6c347c	f8d15787-d49a-4c04-9dce-e912e570d3d4	ADMIN	\N	SUPPLIER_APPROVE	Supplier	81d6c405-f4eb-4559-ac3b-aa752406c359	ALLOWED	{"reason": "Homologacion manual"}	2026-07-02 16:26:14.51	2026-07-02 16:26:14.51
a9fbacab-537d-4c3a-8811-d6a4a3aef970	f8d15787-d49a-4c04-9dce-e912e570d3d4	ADMIN	\N	LOGOUT	User	f8d15787-d49a-4c04-9dce-e912e570d3d4	ALLOWED	\N	2026-07-02 16:27:03.675	2026-07-02 16:27:03.675
98eb84aa-78b0-48d6-a95a-99a26160aac3	865de70c-72a5-494a-80cc-89ed9aa31270	PROVEEDOR	172.18.0.4	LOGIN_SUCCESS	User	865de70c-72a5-494a-80cc-89ed9aa31270	ALLOWED	\N	2026-07-02 16:27:12.386	2026-07-02 16:27:12.386
bf9195d2-21dd-442f-a96a-d2b3b97a167a	865de70c-72a5-494a-80cc-89ed9aa31270	PROVEEDOR	\N	LOGOUT	User	865de70c-72a5-494a-80cc-89ed9aa31270	ALLOWED	\N	2026-07-02 16:27:31.026	2026-07-02 16:27:31.026
3ae415ad-c172-4649-84c8-30e06b4df1ca	f8d15787-d49a-4c04-9dce-e912e570d3d4	ADMIN	172.18.0.4	LOGIN_SUCCESS	User	f8d15787-d49a-4c04-9dce-e912e570d3d4	ALLOWED	\N	2026-07-02 16:30:31.892	2026-07-02 16:30:31.892
2ca43366-632e-4948-a909-138e4b304b56	f8d15787-d49a-4c04-9dce-e912e570d3d4	ADMIN	172.18.0.4	LOGIN_SUCCESS	User	f8d15787-d49a-4c04-9dce-e912e570d3d4	ALLOWED	\N	2026-07-02 16:46:10.523	2026-07-02 16:46:10.523
0651a623-9aab-4c50-b97c-0d927221cfd7	f8d15787-d49a-4c04-9dce-e912e570d3d4	ADMIN	172.18.0.4	LOGIN_SUCCESS	User	f8d15787-d49a-4c04-9dce-e912e570d3d4	ALLOWED	\N	2026-07-02 17:19:06.316	2026-07-02 17:19:06.316
4a4d928b-7311-4ee6-8194-9273495bd7cf	\N	\N	172.18.0.2	LOGIN_FAILED	User	\N	DENIED	{"email": "admin@localhost.test"}	2026-07-02 17:56:27.941	2026-07-02 17:56:27.941
1c0e2d79-1cc3-43c8-a3fb-c6ab2500fdf8	f8d15787-d49a-4c04-9dce-e912e570d3d4	ADMIN	172.18.0.2	LOGIN_SUCCESS	User	f8d15787-d49a-4c04-9dce-e912e570d3d4	ALLOWED	\N	2026-07-02 17:56:34.521	2026-07-02 17:56:34.521
\.


--
-- Data for Name: Award; Type: TABLE DATA; Schema: public; Owner: licer
--

COPY public."Award" (id, "tenderId", "supplierId", "bidId", amount, status, reason, "approvedById", "createdAt", "updatedAt", "deletedAt") FROM stdin;
\.


--
-- Data for Name: Bid; Type: TABLE DATA; Schema: public; Owner: licer
--

COPY public."Bid" (id, "tenderId", "supplierId", "userId", version, status, "submittedAt", "replacedById", "totalAmount", currency, "validityDays", "paymentTerms", "deliveryTerms", "receiptCode", "voidedAt", "voidReason", "createdAt", "updatedAt", "deletedAt") FROM stdin;
\.


--
-- Data for Name: BidDocument; Type: TABLE DATA; Schema: public; Owner: licer
--

COPY public."BidDocument" (id, "bidId", "fileId", type, "uploadedAt", "voidedAt", "voidReason", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: BidItem; Type: TABLE DATA; Schema: public; Owner: licer
--

COPY public."BidItem" (id, "bidId", "tenderItemId", quantity, "unitPrice", tax, total, "brandModel", notes, "createdAt", "updatedAt", "deletedAt") FROM stdin;
\.


--
-- Data for Name: EvaluationCriteria; Type: TABLE DATA; Schema: public; Owner: licer
--

COPY public."EvaluationCriteria" (id, "tenderId", category, name, description, weight, "maxScore", "createdAt", "updatedAt", "deletedAt") FROM stdin;
\.


--
-- Data for Name: EvaluationScore; Type: TABLE DATA; Schema: public; Owner: licer
--

COPY public."EvaluationScore" (id, "bidId", "criteriaId", "evaluatorId", score, comment, "createdAt", "updatedAt", "deletedAt") FROM stdin;
\.


--
-- Data for Name: FileObject; Type: TABLE DATA; Schema: public; Owner: licer
--

COPY public."FileObject" (id, "storagePath", "originalName", mime, size, sha256, "uploadedById", "createdAt", "updatedAt", "deletedAt") FROM stdin;
\.


--
-- Data for Name: Notification; Type: TABLE DATA; Schema: public; Owner: licer
--

COPY public."Notification" (id, "userId", "supplierId", "tenderId", channel, subject, body, status, metadata, "readAt", "sentAt", "createdAt", "updatedAt", "deletedAt") FROM stdin;
\.


--
-- Data for Name: Permission; Type: TABLE DATA; Schema: public; Owner: licer
--

COPY public."Permission" (id, code, resource, action, scope, description, "createdAt", "updatedAt") FROM stdin;
0b2c5fa8-6c8e-4e9d-90f7-7bbeffb054d1	tender-documents:create:internal	tender-documents	create	internal	\N	2026-07-02 16:04:17.254	2026-07-02 17:55:02.837
668ea344-d2e1-4747-9b9c-285e4154396c	tender-documents:read:internal	tender-documents	read	internal	\N	2026-07-02 16:04:17.262	2026-07-02 17:55:02.846
3e979322-ad28-4b8a-be5d-7186b5855e13	evaluations:read:internal	evaluations	read	internal	\N	2026-07-02 16:04:17.36	2026-07-02 17:55:02.914
2a3b1ad3-fbd7-4594-9268-d38a20e85fac	evaluations:update:internal	evaluations	update	internal	\N	2026-07-02 16:04:17.368	2026-07-02 17:55:02.921
542ad943-df5b-482b-b904-5392ce745c8b	awards:create:internal	awards	create	internal	\N	2026-07-02 16:04:17.375	2026-07-02 17:55:02.927
29948a4a-a149-49d2-96f9-172cde671476	awards:cancel:internal	awards	cancel	internal	\N	2026-07-02 16:04:17.381	2026-07-02 17:55:02.933
4dcb5154-8e56-458f-982f-4e511ea2ed37	awards:desert:internal	awards	desert	internal	\N	2026-07-02 16:04:17.388	2026-07-02 17:55:02.939
f654bd80-6d61-4e6a-8e33-13a3f285eaad	audit:read:internal	audit	read	internal	\N	2026-07-02 16:04:17.394	2026-07-02 17:55:02.945
d84257c4-f919-4476-a5c9-a70c73e3918a	requesting-areas:delete:internal	requesting-areas	delete	internal	\N	2026-07-02 17:15:23.485	2026-07-02 17:55:02.998
ba264025-72ec-4145-8d32-aaef5c651607	auth:login:public	auth	login	public	\N	2026-07-02 16:04:17.094	2026-07-02 17:55:02.689
486ce164-6cba-4f30-a85c-fbbff4d23329	auth:logout:own	auth	logout	own	\N	2026-07-02 16:04:17.117	2026-07-02 17:55:02.711
2c71c4d6-96f1-47dc-9bcd-b490349bedb7	users:create:internal	users	create	internal	\N	2026-07-02 16:04:17.125	2026-07-02 17:55:02.717
ce2f682a-7838-4c36-973a-f042fb65e38e	users:read:internal	users	read	internal	\N	2026-07-02 16:04:17.131	2026-07-02 17:55:02.724
d703f8c6-93e5-4f23-92c4-3ffa82243502	users:update:internal	users	update	internal	\N	2026-07-02 16:04:17.137	2026-07-02 17:55:02.73
5a14d466-0bb3-4c58-b049-51b8b8a8114d	roles:create:internal	roles	create	internal	\N	2026-07-02 16:04:17.142	2026-07-02 17:55:02.736
4d227dba-660b-4e09-b64e-aa7c698131a9	suppliers:register:public	suppliers	register	public	\N	2026-07-02 16:04:17.161	2026-07-02 17:55:02.756
03eb66d3-3036-4143-af03-9107412628d4	suppliers:create:internal	suppliers	create	internal	\N	2026-07-02 16:04:17.167	2026-07-02 17:55:02.763
6f88378b-8ab8-4f87-93ee-b45b392b8905	suppliers:read:internal	suppliers	read	internal	\N	2026-07-02 16:04:17.173	2026-07-02 17:55:02.769
ea2e00b8-c33c-460b-9506-7f75603cbac7	suppliers:update:internal	suppliers	update	internal	\N	2026-07-02 16:04:17.18	2026-07-02 17:55:02.775
64b7b2a9-eec2-48b5-9abe-c40daa083327	suppliers:approve:internal	suppliers	approve	internal	\N	2026-07-02 16:04:17.186	2026-07-02 17:55:02.78
a5cb7128-ee16-4ff1-860c-0b84d6ab8f63	suppliers:block:internal	suppliers	block	internal	\N	2026-07-02 16:04:17.193	2026-07-02 17:55:02.785
0b877987-ff17-477b-965d-81a9ff9cb2dd	suppliers:read:own	suppliers	read	own	\N	2026-07-02 16:04:17.199	2026-07-02 17:55:02.79
e59921ba-857e-4f0f-b9f3-32a4dd097db9	suppliers:update:own	suppliers	update	own	\N	2026-07-02 16:04:17.205	2026-07-02 17:55:02.796
9c40b697-4b7a-4988-ada7-fa0f9c4f9269	tenders:create:internal	tenders	create	internal	\N	2026-07-02 16:04:17.212	2026-07-02 17:55:02.801
dacbde0c-50a1-4e66-ad0c-d14e21a220fc	tenders:read:internal	tenders	read	internal	\N	2026-07-02 16:04:17.219	2026-07-02 17:55:02.807
e2f0790e-e2b5-4b5d-aa2e-b9bd10174c88	tender-documents:read:published	tender-documents	read	published	\N	2026-07-02 16:04:17.269	2026-07-02 17:55:02.853
b1d732eb-1693-4e80-99d3-5df21c39a1e0	tender-documents:void:internal	tender-documents	void	internal	\N	2026-07-02 16:04:17.276	2026-07-02 17:55:02.858
f9a57bd7-e991-40cf-98df-b655b8bf314d	questions:create:own	questions	create	own	\N	2026-07-02 16:04:17.285	2026-07-02 17:55:02.863
82df40ac-af69-4ae4-bb3a-03d893a78a3c	questions:read:own	questions	read	own	\N	2026-07-02 16:04:17.292	2026-07-02 17:55:02.868
87e842c0-97ea-42a5-a30f-764b5e2b036a	questions:read:internal	questions	read	internal	\N	2026-07-02 16:04:17.3	2026-07-02 17:55:02.873
f94edcf2-6fa9-4d40-82f8-d7ce2ad2a541	questions:answer:internal	questions	answer	internal	\N	2026-07-02 16:04:17.308	2026-07-02 17:55:02.879
fc217547-297c-44f1-a984-1970884f0364	bids:create:own	bids	create	own	\N	2026-07-02 16:04:17.316	2026-07-02 17:55:02.884
9ebd60f4-427a-4269-a234-ba5326f76487	bids:read:own	bids	read	own	\N	2026-07-02 16:04:17.325	2026-07-02 17:55:02.888
a70c68e0-27c0-48ae-bdd5-6bda716a23cb	bids:submit:own	bids	submit	own	\N	2026-07-02 16:04:17.332	2026-07-02 17:55:02.894
431312fa-cf57-40bd-804f-3cfef9a899e4	bids:replace:own	bids	replace	own	\N	2026-07-02 16:04:17.339	2026-07-02 17:55:02.9
d089cbd1-f8d4-4652-98d4-f4ce88f5c732	bids:read:internal	bids	read	internal	\N	2026-07-02 16:04:17.346	2026-07-02 17:55:02.905
c8876672-0037-427c-9256-f44a07a67a8a	evaluations:create:internal	evaluations	create	internal	\N	2026-07-02 16:04:17.353	2026-07-02 17:55:02.909
9502b981-b572-4387-8115-68578369ebdf	files:download:own	files	download	own	\N	2026-07-02 16:04:17.401	2026-07-02 17:55:02.951
e5342af9-7ded-4b01-9f36-d97b268c116e	files:download:internal	files	download	internal	\N	2026-07-02 16:04:17.408	2026-07-02 17:55:02.957
04569d1c-8abf-4125-aa24-1752ab632d94	reports:read:internal	reports	read	internal	\N	2026-07-02 16:04:17.415	2026-07-02 17:55:02.963
5a0e00c3-dd92-4d07-bec9-91e9fc806b82	notifications:create:internal	notifications	create	internal	\N	2026-07-02 16:04:17.423	2026-07-02 17:55:02.969
fa0b9684-9fb6-41e7-8822-e25219638d12	notifications:read:own	notifications	read	own	\N	2026-07-02 16:04:17.433	2026-07-02 17:55:02.975
bf0c46a0-6390-4293-8459-0d97aa23745b	requesting-areas:create:internal	requesting-areas	create	internal	\N	2026-07-02 17:15:23.462	2026-07-02 17:55:02.981
c1393646-178a-4b88-9980-4dfade73bc4c	requesting-areas:read:internal	requesting-areas	read	internal	\N	2026-07-02 17:15:23.469	2026-07-02 17:55:02.986
2349a243-074d-4d53-a3ce-41490044cd66	requesting-areas:update:internal	requesting-areas	update	internal	\N	2026-07-02 17:15:23.478	2026-07-02 17:55:02.992
96af730e-644c-4da1-917b-c3d71c53d31d	roles:read:internal	roles	read	internal	\N	2026-07-02 16:04:17.149	2026-07-02 17:55:02.742
f251670b-b177-4046-b369-2d1f7e916733	roles:update:internal	roles	update	internal	\N	2026-07-02 16:04:17.154	2026-07-02 17:55:02.749
32ffe285-a85a-45cd-85e9-55c261b553c8	tenders:read:published	tenders	read	published	\N	2026-07-02 16:04:17.226	2026-07-02 17:55:02.813
e19cbfd1-f113-4c6e-9e78-bff68a0ab2a6	tenders:update:internal	tenders	update	internal	\N	2026-07-02 16:04:17.233	2026-07-02 17:55:02.82
fbef4836-3bc2-4364-8260-70082d19dc71	tenders:publish:internal	tenders	publish	internal	\N	2026-07-02 16:04:17.241	2026-07-02 17:55:02.825
4b1deadf-bf1d-41ac-aa6b-54dc679a6aba	tenders:close:internal	tenders	close	internal	\N	2026-07-02 16:04:17.248	2026-07-02 17:55:02.832
\.


--
-- Data for Name: Question; Type: TABLE DATA; Schema: public; Owner: licer
--

COPY public."Question" (id, "tenderId", "supplierId", "userId", text, status, "createdAt", "updatedAt", "deletedAt") FROM stdin;
\.


--
-- Data for Name: RequestingArea; Type: TABLE DATA; Schema: public; Owner: licer
--

COPY public."RequestingArea" (id, code, name, description, status, "createdAt", "updatedAt", "deletedAt") FROM stdin;
dc3470b3-2dbc-4921-8513-33f3d2f615c7	ADM	Administracion	Area de Administracion General	ACTIVA	2026-07-02 17:15:25.801	2026-07-02 17:55:05.102	\N
1c47b44b-0b03-4dd2-ab5f-4629ea18f562	FIN	Finanzas	Area de Finanzas y Contabilidad	ACTIVA	2026-07-02 17:15:25.809	2026-07-02 17:55:05.125	\N
e7ff0da4-bc45-49b9-a218-ee3de9553958	SIS	Sistemas	Area de Sistemas y Tecnologia	ACTIVA	2026-07-02 17:15:25.816	2026-07-02 17:55:05.133	\N
6584d005-fc2f-4359-b211-196329ff3425	COM	Compras	Area de Compras y Abastecimiento	ACTIVA	2026-07-02 17:15:25.823	2026-07-02 17:55:05.138	\N
15eae303-2288-4870-830c-bb4af6dbe057	OPE	Operaciones	Area de Operaciones	ACTIVA	2026-07-02 17:15:25.83	2026-07-02 17:55:05.145	\N
\.


--
-- Data for Name: Role; Type: TABLE DATA; Schema: public; Owner: licer
--

COPY public."Role" (id, name, description, "createdAt", "updatedAt") FROM stdin;
1d31bb00-32af-4b5f-8fe2-064033ae5457	ADMIN	Rol ADMIN	2026-07-02 16:04:17.441	2026-07-02 17:55:03.005
a86aa75a-752a-485a-a8bc-7d9ec2ca5f39	COMPRAS	Rol COMPRAS	2026-07-02 16:04:17.484	2026-07-02 17:55:03.031
4dc13ef9-20f5-4229-87df-8e221e0beb80	AREA_SOLICITANTE	Rol AREA_SOLICITANTE	2026-07-02 16:04:17.51	2026-07-02 17:55:03.045
3697f690-0d83-4e52-8cd2-169279cced24	EVALUADOR_TECNICO	Rol EVALUADOR_TECNICO	2026-07-02 16:04:17.536	2026-07-02 17:55:03.057
a0aebbb9-ee09-423c-82c3-ba3854340e71	EVALUADOR_ECONOMICO	Rol EVALUADOR_ECONOMICO	2026-07-02 16:04:17.565	2026-07-02 17:55:03.069
78ba9351-fe33-4b4d-8d0a-d06ca14b19a8	APROBADOR	Rol APROBADOR	2026-07-02 16:04:17.589	2026-07-02 17:55:03.08
3c21c067-203a-4c4e-ac74-af23d64bc60d	AUDITOR	Rol AUDITOR	2026-07-02 16:04:17.61	2026-07-02 17:55:03.09
98ff3a59-aeca-4cfe-95c7-86ceca26b897	PROVEEDOR	Rol PROVEEDOR	2026-07-02 16:04:17.633	2026-07-02 17:55:03.102
\.


--
-- Data for Name: RolePermission; Type: TABLE DATA; Schema: public; Owner: licer
--

COPY public."RolePermission" ("roleId", "permissionId") FROM stdin;
1d31bb00-32af-4b5f-8fe2-064033ae5457	ba264025-72ec-4145-8d32-aaef5c651607
1d31bb00-32af-4b5f-8fe2-064033ae5457	486ce164-6cba-4f30-a85c-fbbff4d23329
1d31bb00-32af-4b5f-8fe2-064033ae5457	2c71c4d6-96f1-47dc-9bcd-b490349bedb7
1d31bb00-32af-4b5f-8fe2-064033ae5457	ce2f682a-7838-4c36-973a-f042fb65e38e
1d31bb00-32af-4b5f-8fe2-064033ae5457	d703f8c6-93e5-4f23-92c4-3ffa82243502
1d31bb00-32af-4b5f-8fe2-064033ae5457	5a14d466-0bb3-4c58-b049-51b8b8a8114d
1d31bb00-32af-4b5f-8fe2-064033ae5457	96af730e-644c-4da1-917b-c3d71c53d31d
1d31bb00-32af-4b5f-8fe2-064033ae5457	f251670b-b177-4046-b369-2d1f7e916733
1d31bb00-32af-4b5f-8fe2-064033ae5457	4d227dba-660b-4e09-b64e-aa7c698131a9
1d31bb00-32af-4b5f-8fe2-064033ae5457	03eb66d3-3036-4143-af03-9107412628d4
1d31bb00-32af-4b5f-8fe2-064033ae5457	6f88378b-8ab8-4f87-93ee-b45b392b8905
1d31bb00-32af-4b5f-8fe2-064033ae5457	ea2e00b8-c33c-460b-9506-7f75603cbac7
1d31bb00-32af-4b5f-8fe2-064033ae5457	64b7b2a9-eec2-48b5-9abe-c40daa083327
1d31bb00-32af-4b5f-8fe2-064033ae5457	a5cb7128-ee16-4ff1-860c-0b84d6ab8f63
1d31bb00-32af-4b5f-8fe2-064033ae5457	0b877987-ff17-477b-965d-81a9ff9cb2dd
1d31bb00-32af-4b5f-8fe2-064033ae5457	e59921ba-857e-4f0f-b9f3-32a4dd097db9
1d31bb00-32af-4b5f-8fe2-064033ae5457	9c40b697-4b7a-4988-ada7-fa0f9c4f9269
1d31bb00-32af-4b5f-8fe2-064033ae5457	dacbde0c-50a1-4e66-ad0c-d14e21a220fc
1d31bb00-32af-4b5f-8fe2-064033ae5457	32ffe285-a85a-45cd-85e9-55c261b553c8
1d31bb00-32af-4b5f-8fe2-064033ae5457	e19cbfd1-f113-4c6e-9e78-bff68a0ab2a6
1d31bb00-32af-4b5f-8fe2-064033ae5457	fbef4836-3bc2-4364-8260-70082d19dc71
1d31bb00-32af-4b5f-8fe2-064033ae5457	4b1deadf-bf1d-41ac-aa6b-54dc679a6aba
1d31bb00-32af-4b5f-8fe2-064033ae5457	0b2c5fa8-6c8e-4e9d-90f7-7bbeffb054d1
1d31bb00-32af-4b5f-8fe2-064033ae5457	668ea344-d2e1-4747-9b9c-285e4154396c
1d31bb00-32af-4b5f-8fe2-064033ae5457	e2f0790e-e2b5-4b5d-aa2e-b9bd10174c88
1d31bb00-32af-4b5f-8fe2-064033ae5457	b1d732eb-1693-4e80-99d3-5df21c39a1e0
1d31bb00-32af-4b5f-8fe2-064033ae5457	f9a57bd7-e991-40cf-98df-b655b8bf314d
1d31bb00-32af-4b5f-8fe2-064033ae5457	82df40ac-af69-4ae4-bb3a-03d893a78a3c
1d31bb00-32af-4b5f-8fe2-064033ae5457	87e842c0-97ea-42a5-a30f-764b5e2b036a
1d31bb00-32af-4b5f-8fe2-064033ae5457	f94edcf2-6fa9-4d40-82f8-d7ce2ad2a541
1d31bb00-32af-4b5f-8fe2-064033ae5457	fc217547-297c-44f1-a984-1970884f0364
1d31bb00-32af-4b5f-8fe2-064033ae5457	9ebd60f4-427a-4269-a234-ba5326f76487
1d31bb00-32af-4b5f-8fe2-064033ae5457	a70c68e0-27c0-48ae-bdd5-6bda716a23cb
1d31bb00-32af-4b5f-8fe2-064033ae5457	431312fa-cf57-40bd-804f-3cfef9a899e4
1d31bb00-32af-4b5f-8fe2-064033ae5457	d089cbd1-f8d4-4652-98d4-f4ce88f5c732
1d31bb00-32af-4b5f-8fe2-064033ae5457	c8876672-0037-427c-9256-f44a07a67a8a
1d31bb00-32af-4b5f-8fe2-064033ae5457	3e979322-ad28-4b8a-be5d-7186b5855e13
1d31bb00-32af-4b5f-8fe2-064033ae5457	2a3b1ad3-fbd7-4594-9268-d38a20e85fac
1d31bb00-32af-4b5f-8fe2-064033ae5457	542ad943-df5b-482b-b904-5392ce745c8b
1d31bb00-32af-4b5f-8fe2-064033ae5457	29948a4a-a149-49d2-96f9-172cde671476
1d31bb00-32af-4b5f-8fe2-064033ae5457	4dcb5154-8e56-458f-982f-4e511ea2ed37
1d31bb00-32af-4b5f-8fe2-064033ae5457	f654bd80-6d61-4e6a-8e33-13a3f285eaad
1d31bb00-32af-4b5f-8fe2-064033ae5457	9502b981-b572-4387-8115-68578369ebdf
1d31bb00-32af-4b5f-8fe2-064033ae5457	e5342af9-7ded-4b01-9f36-d97b268c116e
1d31bb00-32af-4b5f-8fe2-064033ae5457	04569d1c-8abf-4125-aa24-1752ab632d94
1d31bb00-32af-4b5f-8fe2-064033ae5457	5a0e00c3-dd92-4d07-bec9-91e9fc806b82
1d31bb00-32af-4b5f-8fe2-064033ae5457	fa0b9684-9fb6-41e7-8822-e25219638d12
a86aa75a-752a-485a-a8bc-7d9ec2ca5f39	ce2f682a-7838-4c36-973a-f042fb65e38e
a86aa75a-752a-485a-a8bc-7d9ec2ca5f39	03eb66d3-3036-4143-af03-9107412628d4
a86aa75a-752a-485a-a8bc-7d9ec2ca5f39	6f88378b-8ab8-4f87-93ee-b45b392b8905
a86aa75a-752a-485a-a8bc-7d9ec2ca5f39	ea2e00b8-c33c-460b-9506-7f75603cbac7
a86aa75a-752a-485a-a8bc-7d9ec2ca5f39	64b7b2a9-eec2-48b5-9abe-c40daa083327
a86aa75a-752a-485a-a8bc-7d9ec2ca5f39	a5cb7128-ee16-4ff1-860c-0b84d6ab8f63
a86aa75a-752a-485a-a8bc-7d9ec2ca5f39	9c40b697-4b7a-4988-ada7-fa0f9c4f9269
a86aa75a-752a-485a-a8bc-7d9ec2ca5f39	dacbde0c-50a1-4e66-ad0c-d14e21a220fc
a86aa75a-752a-485a-a8bc-7d9ec2ca5f39	e19cbfd1-f113-4c6e-9e78-bff68a0ab2a6
a86aa75a-752a-485a-a8bc-7d9ec2ca5f39	fbef4836-3bc2-4364-8260-70082d19dc71
a86aa75a-752a-485a-a8bc-7d9ec2ca5f39	4b1deadf-bf1d-41ac-aa6b-54dc679a6aba
a86aa75a-752a-485a-a8bc-7d9ec2ca5f39	0b2c5fa8-6c8e-4e9d-90f7-7bbeffb054d1
a86aa75a-752a-485a-a8bc-7d9ec2ca5f39	668ea344-d2e1-4747-9b9c-285e4154396c
a86aa75a-752a-485a-a8bc-7d9ec2ca5f39	b1d732eb-1693-4e80-99d3-5df21c39a1e0
a86aa75a-752a-485a-a8bc-7d9ec2ca5f39	87e842c0-97ea-42a5-a30f-764b5e2b036a
a86aa75a-752a-485a-a8bc-7d9ec2ca5f39	f94edcf2-6fa9-4d40-82f8-d7ce2ad2a541
a86aa75a-752a-485a-a8bc-7d9ec2ca5f39	d089cbd1-f8d4-4652-98d4-f4ce88f5c732
a86aa75a-752a-485a-a8bc-7d9ec2ca5f39	3e979322-ad28-4b8a-be5d-7186b5855e13
a86aa75a-752a-485a-a8bc-7d9ec2ca5f39	542ad943-df5b-482b-b904-5392ce745c8b
a86aa75a-752a-485a-a8bc-7d9ec2ca5f39	29948a4a-a149-49d2-96f9-172cde671476
a86aa75a-752a-485a-a8bc-7d9ec2ca5f39	4dcb5154-8e56-458f-982f-4e511ea2ed37
a86aa75a-752a-485a-a8bc-7d9ec2ca5f39	e5342af9-7ded-4b01-9f36-d97b268c116e
a86aa75a-752a-485a-a8bc-7d9ec2ca5f39	04569d1c-8abf-4125-aa24-1752ab632d94
a86aa75a-752a-485a-a8bc-7d9ec2ca5f39	5a0e00c3-dd92-4d07-bec9-91e9fc806b82
a86aa75a-752a-485a-a8bc-7d9ec2ca5f39	486ce164-6cba-4f30-a85c-fbbff4d23329
4dc13ef9-20f5-4229-87df-8e221e0beb80	9c40b697-4b7a-4988-ada7-fa0f9c4f9269
4dc13ef9-20f5-4229-87df-8e221e0beb80	dacbde0c-50a1-4e66-ad0c-d14e21a220fc
4dc13ef9-20f5-4229-87df-8e221e0beb80	e19cbfd1-f113-4c6e-9e78-bff68a0ab2a6
4dc13ef9-20f5-4229-87df-8e221e0beb80	87e842c0-97ea-42a5-a30f-764b5e2b036a
4dc13ef9-20f5-4229-87df-8e221e0beb80	3e979322-ad28-4b8a-be5d-7186b5855e13
4dc13ef9-20f5-4229-87df-8e221e0beb80	486ce164-6cba-4f30-a85c-fbbff4d23329
3697f690-0d83-4e52-8cd2-169279cced24	6f88378b-8ab8-4f87-93ee-b45b392b8905
3697f690-0d83-4e52-8cd2-169279cced24	dacbde0c-50a1-4e66-ad0c-d14e21a220fc
3697f690-0d83-4e52-8cd2-169279cced24	87e842c0-97ea-42a5-a30f-764b5e2b036a
3697f690-0d83-4e52-8cd2-169279cced24	d089cbd1-f8d4-4652-98d4-f4ce88f5c732
3697f690-0d83-4e52-8cd2-169279cced24	c8876672-0037-427c-9256-f44a07a67a8a
3697f690-0d83-4e52-8cd2-169279cced24	3e979322-ad28-4b8a-be5d-7186b5855e13
3697f690-0d83-4e52-8cd2-169279cced24	2a3b1ad3-fbd7-4594-9268-d38a20e85fac
3697f690-0d83-4e52-8cd2-169279cced24	e5342af9-7ded-4b01-9f36-d97b268c116e
3697f690-0d83-4e52-8cd2-169279cced24	486ce164-6cba-4f30-a85c-fbbff4d23329
a0aebbb9-ee09-423c-82c3-ba3854340e71	6f88378b-8ab8-4f87-93ee-b45b392b8905
a0aebbb9-ee09-423c-82c3-ba3854340e71	dacbde0c-50a1-4e66-ad0c-d14e21a220fc
a0aebbb9-ee09-423c-82c3-ba3854340e71	d089cbd1-f8d4-4652-98d4-f4ce88f5c732
a0aebbb9-ee09-423c-82c3-ba3854340e71	c8876672-0037-427c-9256-f44a07a67a8a
a0aebbb9-ee09-423c-82c3-ba3854340e71	3e979322-ad28-4b8a-be5d-7186b5855e13
a0aebbb9-ee09-423c-82c3-ba3854340e71	2a3b1ad3-fbd7-4594-9268-d38a20e85fac
a0aebbb9-ee09-423c-82c3-ba3854340e71	e5342af9-7ded-4b01-9f36-d97b268c116e
a0aebbb9-ee09-423c-82c3-ba3854340e71	486ce164-6cba-4f30-a85c-fbbff4d23329
78ba9351-fe33-4b4d-8d0a-d06ca14b19a8	6f88378b-8ab8-4f87-93ee-b45b392b8905
78ba9351-fe33-4b4d-8d0a-d06ca14b19a8	dacbde0c-50a1-4e66-ad0c-d14e21a220fc
78ba9351-fe33-4b4d-8d0a-d06ca14b19a8	d089cbd1-f8d4-4652-98d4-f4ce88f5c732
78ba9351-fe33-4b4d-8d0a-d06ca14b19a8	3e979322-ad28-4b8a-be5d-7186b5855e13
78ba9351-fe33-4b4d-8d0a-d06ca14b19a8	542ad943-df5b-482b-b904-5392ce745c8b
78ba9351-fe33-4b4d-8d0a-d06ca14b19a8	29948a4a-a149-49d2-96f9-172cde671476
78ba9351-fe33-4b4d-8d0a-d06ca14b19a8	4dcb5154-8e56-458f-982f-4e511ea2ed37
78ba9351-fe33-4b4d-8d0a-d06ca14b19a8	e5342af9-7ded-4b01-9f36-d97b268c116e
78ba9351-fe33-4b4d-8d0a-d06ca14b19a8	04569d1c-8abf-4125-aa24-1752ab632d94
78ba9351-fe33-4b4d-8d0a-d06ca14b19a8	486ce164-6cba-4f30-a85c-fbbff4d23329
3c21c067-203a-4c4e-ac74-af23d64bc60d	ce2f682a-7838-4c36-973a-f042fb65e38e
3c21c067-203a-4c4e-ac74-af23d64bc60d	96af730e-644c-4da1-917b-c3d71c53d31d
3c21c067-203a-4c4e-ac74-af23d64bc60d	6f88378b-8ab8-4f87-93ee-b45b392b8905
3c21c067-203a-4c4e-ac74-af23d64bc60d	dacbde0c-50a1-4e66-ad0c-d14e21a220fc
3c21c067-203a-4c4e-ac74-af23d64bc60d	668ea344-d2e1-4747-9b9c-285e4154396c
3c21c067-203a-4c4e-ac74-af23d64bc60d	87e842c0-97ea-42a5-a30f-764b5e2b036a
3c21c067-203a-4c4e-ac74-af23d64bc60d	d089cbd1-f8d4-4652-98d4-f4ce88f5c732
3c21c067-203a-4c4e-ac74-af23d64bc60d	3e979322-ad28-4b8a-be5d-7186b5855e13
3c21c067-203a-4c4e-ac74-af23d64bc60d	f654bd80-6d61-4e6a-8e33-13a3f285eaad
3c21c067-203a-4c4e-ac74-af23d64bc60d	e5342af9-7ded-4b01-9f36-d97b268c116e
3c21c067-203a-4c4e-ac74-af23d64bc60d	04569d1c-8abf-4125-aa24-1752ab632d94
3c21c067-203a-4c4e-ac74-af23d64bc60d	486ce164-6cba-4f30-a85c-fbbff4d23329
98ff3a59-aeca-4cfe-95c7-86ceca26b897	0b877987-ff17-477b-965d-81a9ff9cb2dd
98ff3a59-aeca-4cfe-95c7-86ceca26b897	e59921ba-857e-4f0f-b9f3-32a4dd097db9
98ff3a59-aeca-4cfe-95c7-86ceca26b897	32ffe285-a85a-45cd-85e9-55c261b553c8
98ff3a59-aeca-4cfe-95c7-86ceca26b897	e2f0790e-e2b5-4b5d-aa2e-b9bd10174c88
98ff3a59-aeca-4cfe-95c7-86ceca26b897	f9a57bd7-e991-40cf-98df-b655b8bf314d
98ff3a59-aeca-4cfe-95c7-86ceca26b897	82df40ac-af69-4ae4-bb3a-03d893a78a3c
98ff3a59-aeca-4cfe-95c7-86ceca26b897	fc217547-297c-44f1-a984-1970884f0364
98ff3a59-aeca-4cfe-95c7-86ceca26b897	9ebd60f4-427a-4269-a234-ba5326f76487
98ff3a59-aeca-4cfe-95c7-86ceca26b897	a70c68e0-27c0-48ae-bdd5-6bda716a23cb
98ff3a59-aeca-4cfe-95c7-86ceca26b897	431312fa-cf57-40bd-804f-3cfef9a899e4
98ff3a59-aeca-4cfe-95c7-86ceca26b897	9502b981-b572-4387-8115-68578369ebdf
98ff3a59-aeca-4cfe-95c7-86ceca26b897	fa0b9684-9fb6-41e7-8822-e25219638d12
98ff3a59-aeca-4cfe-95c7-86ceca26b897	486ce164-6cba-4f30-a85c-fbbff4d23329
1d31bb00-32af-4b5f-8fe2-064033ae5457	bf0c46a0-6390-4293-8459-0d97aa23745b
1d31bb00-32af-4b5f-8fe2-064033ae5457	c1393646-178a-4b88-9980-4dfade73bc4c
1d31bb00-32af-4b5f-8fe2-064033ae5457	2349a243-074d-4d53-a3ce-41490044cd66
1d31bb00-32af-4b5f-8fe2-064033ae5457	d84257c4-f919-4476-a5c9-a70c73e3918a
\.


--
-- Data for Name: Supplier; Type: TABLE DATA; Schema: public; Owner: licer
--

COPY public."Supplier" (id, ruc, "legalName", "tradeName", "contactName", "contactEmail", phone, address, categories, status, "createdAt", "updatedAt", "deletedAt") FROM stdin;
81d6c405-f4eb-4559-ac3b-aa752406c359	80000000-0	Proveedor Prueba	Proveedor Prueba	Usuario Prueba	prueba@local.test	\N	\N	{general}	ACTIVO	2026-07-02 16:04:18.439	2026-07-02 17:55:03.824	\N
\.


--
-- Data for Name: SupplierDocument; Type: TABLE DATA; Schema: public; Owner: licer
--

COPY public."SupplierDocument" (id, "supplierId", type, "fileId", status, "expiresAt", "voidedAt", "voidReason", "createdAt", "updatedAt", "deletedAt") FROM stdin;
\.


--
-- Data for Name: Tender; Type: TABLE DATA; Schema: public; Owner: licer
--

COPY public."Tender" (id, code, title, description, status, currency, "buyerId", "requesterArea", "allowBidReplacement", "publishedAt", "questionDeadline", "bidDeadline", "evaluationStart", "estimatedAwardAt", "createdAt", "updatedAt", "deletedAt", "requestingAreaId") FROM stdin;
\.


--
-- Data for Name: TenderDocument; Type: TABLE DATA; Schema: public; Owner: licer
--

COPY public."TenderDocument" (id, "tenderId", type, version, title, "fileId", "publishedAt", "voidedAt", "voidReason", "createdById", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: TenderItem; Type: TABLE DATA; Schema: public; Owner: licer
--

COPY public."TenderItem" (id, "tenderId", lot, description, unit, quantity, specs, "createdAt", "updatedAt", "deletedAt") FROM stdin;
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: licer
--

COPY public."User" (id, email, "passwordHash", name, status, "supplierId", "lastLoginAt", "failedLoginCount", "lockedUntil", "createdAt", "updatedAt", "deletedAt") FROM stdin;
865de70c-72a5-494a-80cc-89ed9aa31270	prueba@local.test	$2a$12$NZcC8wfLCkOkOsog9ZxZPOMEH5pbJLEL9Ud6Pi26IPv9DJ0GbDGKq	Proveedor Prueba	ACTIVE	81d6c405-f4eb-4559-ac3b-aa752406c359	2026-07-02 16:27:12.373	0	\N	2026-07-02 16:04:19.703	2026-07-02 17:55:05.085	\N
f8d15787-d49a-4c04-9dce-e912e570d3d4	admin@local.test	$2a$12$fc68qgS2hwbprQUbudVs/O7AY6YD29houWfCAwvoFk4kEKqMb7v7e	Administrador	ACTIVE	\N	2026-07-02 17:56:34.505	0	\N	2026-07-02 16:04:18.404	2026-07-02 17:56:34.509	\N
\.


--
-- Data for Name: UserRole; Type: TABLE DATA; Schema: public; Owner: licer
--

COPY public."UserRole" ("userId", "roleId", "assignedAt") FROM stdin;
f8d15787-d49a-4c04-9dce-e912e570d3d4	1d31bb00-32af-4b5f-8fe2-064033ae5457	2026-07-02 16:04:18.42
865de70c-72a5-494a-80cc-89ed9aa31270	98ff3a59-aeca-4cfe-95c7-86ceca26b897	2026-07-02 16:04:19.716
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: licer
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
8ce3cd0d-17fc-4ddd-ba44-c2a8675686e1	dcd33196ef016d391210863985b321aab0b540a647dad62bcbb72760e7c41c2c	2026-07-02 16:03:59.231337+00	20260702110000_init	\N	\N	2026-07-02 16:03:58.191425+00	1
e98b09e6-f51d-413a-a8ce-3976ca83f404	4c6dc5a4661b9646a4f75ceb84057f0a008e0a39c1b0092a0f2afbb09c8d4841	2026-07-02 17:15:09.220749+00	20260702165410_add_requesting_areas	\N	\N	2026-07-02 17:15:09.047509+00	1
\.


--
-- Name: Answer Answer_pkey; Type: CONSTRAINT; Schema: public; Owner: licer
--

ALTER TABLE ONLY public."Answer"
    ADD CONSTRAINT "Answer_pkey" PRIMARY KEY (id);


--
-- Name: AuditLog AuditLog_pkey; Type: CONSTRAINT; Schema: public; Owner: licer
--

ALTER TABLE ONLY public."AuditLog"
    ADD CONSTRAINT "AuditLog_pkey" PRIMARY KEY (id);


--
-- Name: Award Award_pkey; Type: CONSTRAINT; Schema: public; Owner: licer
--

ALTER TABLE ONLY public."Award"
    ADD CONSTRAINT "Award_pkey" PRIMARY KEY (id);


--
-- Name: BidDocument BidDocument_pkey; Type: CONSTRAINT; Schema: public; Owner: licer
--

ALTER TABLE ONLY public."BidDocument"
    ADD CONSTRAINT "BidDocument_pkey" PRIMARY KEY (id);


--
-- Name: BidItem BidItem_pkey; Type: CONSTRAINT; Schema: public; Owner: licer
--

ALTER TABLE ONLY public."BidItem"
    ADD CONSTRAINT "BidItem_pkey" PRIMARY KEY (id);


--
-- Name: Bid Bid_pkey; Type: CONSTRAINT; Schema: public; Owner: licer
--

ALTER TABLE ONLY public."Bid"
    ADD CONSTRAINT "Bid_pkey" PRIMARY KEY (id);


--
-- Name: EvaluationCriteria EvaluationCriteria_pkey; Type: CONSTRAINT; Schema: public; Owner: licer
--

ALTER TABLE ONLY public."EvaluationCriteria"
    ADD CONSTRAINT "EvaluationCriteria_pkey" PRIMARY KEY (id);


--
-- Name: EvaluationScore EvaluationScore_pkey; Type: CONSTRAINT; Schema: public; Owner: licer
--

ALTER TABLE ONLY public."EvaluationScore"
    ADD CONSTRAINT "EvaluationScore_pkey" PRIMARY KEY (id);


--
-- Name: FileObject FileObject_pkey; Type: CONSTRAINT; Schema: public; Owner: licer
--

ALTER TABLE ONLY public."FileObject"
    ADD CONSTRAINT "FileObject_pkey" PRIMARY KEY (id);


--
-- Name: Notification Notification_pkey; Type: CONSTRAINT; Schema: public; Owner: licer
--

ALTER TABLE ONLY public."Notification"
    ADD CONSTRAINT "Notification_pkey" PRIMARY KEY (id);


--
-- Name: Permission Permission_pkey; Type: CONSTRAINT; Schema: public; Owner: licer
--

ALTER TABLE ONLY public."Permission"
    ADD CONSTRAINT "Permission_pkey" PRIMARY KEY (id);


--
-- Name: Question Question_pkey; Type: CONSTRAINT; Schema: public; Owner: licer
--

ALTER TABLE ONLY public."Question"
    ADD CONSTRAINT "Question_pkey" PRIMARY KEY (id);


--
-- Name: RequestingArea RequestingArea_pkey; Type: CONSTRAINT; Schema: public; Owner: licer
--

ALTER TABLE ONLY public."RequestingArea"
    ADD CONSTRAINT "RequestingArea_pkey" PRIMARY KEY (id);


--
-- Name: RolePermission RolePermission_pkey; Type: CONSTRAINT; Schema: public; Owner: licer
--

ALTER TABLE ONLY public."RolePermission"
    ADD CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("roleId", "permissionId");


--
-- Name: Role Role_pkey; Type: CONSTRAINT; Schema: public; Owner: licer
--

ALTER TABLE ONLY public."Role"
    ADD CONSTRAINT "Role_pkey" PRIMARY KEY (id);


--
-- Name: SupplierDocument SupplierDocument_pkey; Type: CONSTRAINT; Schema: public; Owner: licer
--

ALTER TABLE ONLY public."SupplierDocument"
    ADD CONSTRAINT "SupplierDocument_pkey" PRIMARY KEY (id);


--
-- Name: Supplier Supplier_pkey; Type: CONSTRAINT; Schema: public; Owner: licer
--

ALTER TABLE ONLY public."Supplier"
    ADD CONSTRAINT "Supplier_pkey" PRIMARY KEY (id);


--
-- Name: TenderDocument TenderDocument_pkey; Type: CONSTRAINT; Schema: public; Owner: licer
--

ALTER TABLE ONLY public."TenderDocument"
    ADD CONSTRAINT "TenderDocument_pkey" PRIMARY KEY (id);


--
-- Name: TenderItem TenderItem_pkey; Type: CONSTRAINT; Schema: public; Owner: licer
--

ALTER TABLE ONLY public."TenderItem"
    ADD CONSTRAINT "TenderItem_pkey" PRIMARY KEY (id);


--
-- Name: Tender Tender_pkey; Type: CONSTRAINT; Schema: public; Owner: licer
--

ALTER TABLE ONLY public."Tender"
    ADD CONSTRAINT "Tender_pkey" PRIMARY KEY (id);


--
-- Name: UserRole UserRole_pkey; Type: CONSTRAINT; Schema: public; Owner: licer
--

ALTER TABLE ONLY public."UserRole"
    ADD CONSTRAINT "UserRole_pkey" PRIMARY KEY ("userId", "roleId");


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: licer
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: licer
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: Answer_authorId_idx; Type: INDEX; Schema: public; Owner: licer
--

CREATE INDEX "Answer_authorId_idx" ON public."Answer" USING btree ("authorId");


--
-- Name: Answer_questionId_key; Type: INDEX; Schema: public; Owner: licer
--

CREATE UNIQUE INDEX "Answer_questionId_key" ON public."Answer" USING btree ("questionId");


--
-- Name: Answer_tenderId_idx; Type: INDEX; Schema: public; Owner: licer
--

CREATE INDEX "Answer_tenderId_idx" ON public."Answer" USING btree ("tenderId");


--
-- Name: AuditLog_action_idx; Type: INDEX; Schema: public; Owner: licer
--

CREATE INDEX "AuditLog_action_idx" ON public."AuditLog" USING btree (action);


--
-- Name: AuditLog_actorId_idx; Type: INDEX; Schema: public; Owner: licer
--

CREATE INDEX "AuditLog_actorId_idx" ON public."AuditLog" USING btree ("actorId");


--
-- Name: AuditLog_createdAt_idx; Type: INDEX; Schema: public; Owner: licer
--

CREATE INDEX "AuditLog_createdAt_idx" ON public."AuditLog" USING btree ("createdAt");


--
-- Name: AuditLog_entityId_idx; Type: INDEX; Schema: public; Owner: licer
--

CREATE INDEX "AuditLog_entityId_idx" ON public."AuditLog" USING btree ("entityId");


--
-- Name: AuditLog_entity_idx; Type: INDEX; Schema: public; Owner: licer
--

CREATE INDEX "AuditLog_entity_idx" ON public."AuditLog" USING btree (entity);


--
-- Name: Award_status_idx; Type: INDEX; Schema: public; Owner: licer
--

CREATE INDEX "Award_status_idx" ON public."Award" USING btree (status);


--
-- Name: Award_supplierId_idx; Type: INDEX; Schema: public; Owner: licer
--

CREATE INDEX "Award_supplierId_idx" ON public."Award" USING btree ("supplierId");


--
-- Name: Award_tenderId_idx; Type: INDEX; Schema: public; Owner: licer
--

CREATE INDEX "Award_tenderId_idx" ON public."Award" USING btree ("tenderId");


--
-- Name: BidDocument_bidId_idx; Type: INDEX; Schema: public; Owner: licer
--

CREATE INDEX "BidDocument_bidId_idx" ON public."BidDocument" USING btree ("bidId");


--
-- Name: BidDocument_fileId_idx; Type: INDEX; Schema: public; Owner: licer
--

CREATE INDEX "BidDocument_fileId_idx" ON public."BidDocument" USING btree ("fileId");


--
-- Name: BidItem_bidId_idx; Type: INDEX; Schema: public; Owner: licer
--

CREATE INDEX "BidItem_bidId_idx" ON public."BidItem" USING btree ("bidId");


--
-- Name: BidItem_tenderItemId_idx; Type: INDEX; Schema: public; Owner: licer
--

CREATE INDEX "BidItem_tenderItemId_idx" ON public."BidItem" USING btree ("tenderItemId");


--
-- Name: Bid_receiptCode_key; Type: INDEX; Schema: public; Owner: licer
--

CREATE UNIQUE INDEX "Bid_receiptCode_key" ON public."Bid" USING btree ("receiptCode");


--
-- Name: Bid_status_idx; Type: INDEX; Schema: public; Owner: licer
--

CREATE INDEX "Bid_status_idx" ON public."Bid" USING btree (status);


--
-- Name: Bid_submittedAt_idx; Type: INDEX; Schema: public; Owner: licer
--

CREATE INDEX "Bid_submittedAt_idx" ON public."Bid" USING btree ("submittedAt");


--
-- Name: Bid_supplierId_idx; Type: INDEX; Schema: public; Owner: licer
--

CREATE INDEX "Bid_supplierId_idx" ON public."Bid" USING btree ("supplierId");


--
-- Name: Bid_tenderId_idx; Type: INDEX; Schema: public; Owner: licer
--

CREATE INDEX "Bid_tenderId_idx" ON public."Bid" USING btree ("tenderId");


--
-- Name: Bid_tenderId_supplierId_version_key; Type: INDEX; Schema: public; Owner: licer
--

CREATE UNIQUE INDEX "Bid_tenderId_supplierId_version_key" ON public."Bid" USING btree ("tenderId", "supplierId", version);


--
-- Name: EvaluationCriteria_category_idx; Type: INDEX; Schema: public; Owner: licer
--

CREATE INDEX "EvaluationCriteria_category_idx" ON public."EvaluationCriteria" USING btree (category);


--
-- Name: EvaluationCriteria_tenderId_idx; Type: INDEX; Schema: public; Owner: licer
--

CREATE INDEX "EvaluationCriteria_tenderId_idx" ON public."EvaluationCriteria" USING btree ("tenderId");


--
-- Name: EvaluationScore_bidId_criteriaId_evaluatorId_key; Type: INDEX; Schema: public; Owner: licer
--

CREATE UNIQUE INDEX "EvaluationScore_bidId_criteriaId_evaluatorId_key" ON public."EvaluationScore" USING btree ("bidId", "criteriaId", "evaluatorId");


--
-- Name: EvaluationScore_bidId_idx; Type: INDEX; Schema: public; Owner: licer
--

CREATE INDEX "EvaluationScore_bidId_idx" ON public."EvaluationScore" USING btree ("bidId");


--
-- Name: EvaluationScore_criteriaId_idx; Type: INDEX; Schema: public; Owner: licer
--

CREATE INDEX "EvaluationScore_criteriaId_idx" ON public."EvaluationScore" USING btree ("criteriaId");


--
-- Name: EvaluationScore_evaluatorId_idx; Type: INDEX; Schema: public; Owner: licer
--

CREATE INDEX "EvaluationScore_evaluatorId_idx" ON public."EvaluationScore" USING btree ("evaluatorId");


--
-- Name: FileObject_sha256_idx; Type: INDEX; Schema: public; Owner: licer
--

CREATE INDEX "FileObject_sha256_idx" ON public."FileObject" USING btree (sha256);


--
-- Name: FileObject_uploadedById_idx; Type: INDEX; Schema: public; Owner: licer
--

CREATE INDEX "FileObject_uploadedById_idx" ON public."FileObject" USING btree ("uploadedById");


--
-- Name: Notification_status_idx; Type: INDEX; Schema: public; Owner: licer
--

CREATE INDEX "Notification_status_idx" ON public."Notification" USING btree (status);


--
-- Name: Notification_supplierId_idx; Type: INDEX; Schema: public; Owner: licer
--

CREATE INDEX "Notification_supplierId_idx" ON public."Notification" USING btree ("supplierId");


--
-- Name: Notification_tenderId_idx; Type: INDEX; Schema: public; Owner: licer
--

CREATE INDEX "Notification_tenderId_idx" ON public."Notification" USING btree ("tenderId");


--
-- Name: Notification_userId_idx; Type: INDEX; Schema: public; Owner: licer
--

CREATE INDEX "Notification_userId_idx" ON public."Notification" USING btree ("userId");


--
-- Name: Permission_code_key; Type: INDEX; Schema: public; Owner: licer
--

CREATE UNIQUE INDEX "Permission_code_key" ON public."Permission" USING btree (code);


--
-- Name: Permission_resource_action_scope_key; Type: INDEX; Schema: public; Owner: licer
--

CREATE UNIQUE INDEX "Permission_resource_action_scope_key" ON public."Permission" USING btree (resource, action, scope);


--
-- Name: Question_status_idx; Type: INDEX; Schema: public; Owner: licer
--

CREATE INDEX "Question_status_idx" ON public."Question" USING btree (status);


--
-- Name: Question_supplierId_idx; Type: INDEX; Schema: public; Owner: licer
--

CREATE INDEX "Question_supplierId_idx" ON public."Question" USING btree ("supplierId");


--
-- Name: Question_tenderId_idx; Type: INDEX; Schema: public; Owner: licer
--

CREATE INDEX "Question_tenderId_idx" ON public."Question" USING btree ("tenderId");


--
-- Name: RequestingArea_code_key; Type: INDEX; Schema: public; Owner: licer
--

CREATE UNIQUE INDEX "RequestingArea_code_key" ON public."RequestingArea" USING btree (code);


--
-- Name: RequestingArea_name_key; Type: INDEX; Schema: public; Owner: licer
--

CREATE UNIQUE INDEX "RequestingArea_name_key" ON public."RequestingArea" USING btree (name);


--
-- Name: RequestingArea_status_idx; Type: INDEX; Schema: public; Owner: licer
--

CREATE INDEX "RequestingArea_status_idx" ON public."RequestingArea" USING btree (status);


--
-- Name: RolePermission_permissionId_idx; Type: INDEX; Schema: public; Owner: licer
--

CREATE INDEX "RolePermission_permissionId_idx" ON public."RolePermission" USING btree ("permissionId");


--
-- Name: Role_name_key; Type: INDEX; Schema: public; Owner: licer
--

CREATE UNIQUE INDEX "Role_name_key" ON public."Role" USING btree (name);


--
-- Name: SupplierDocument_fileId_idx; Type: INDEX; Schema: public; Owner: licer
--

CREATE INDEX "SupplierDocument_fileId_idx" ON public."SupplierDocument" USING btree ("fileId");


--
-- Name: SupplierDocument_status_idx; Type: INDEX; Schema: public; Owner: licer
--

CREATE INDEX "SupplierDocument_status_idx" ON public."SupplierDocument" USING btree (status);


--
-- Name: SupplierDocument_supplierId_idx; Type: INDEX; Schema: public; Owner: licer
--

CREATE INDEX "SupplierDocument_supplierId_idx" ON public."SupplierDocument" USING btree ("supplierId");


--
-- Name: Supplier_ruc_key; Type: INDEX; Schema: public; Owner: licer
--

CREATE UNIQUE INDEX "Supplier_ruc_key" ON public."Supplier" USING btree (ruc);


--
-- Name: Supplier_status_idx; Type: INDEX; Schema: public; Owner: licer
--

CREATE INDEX "Supplier_status_idx" ON public."Supplier" USING btree (status);


--
-- Name: TenderDocument_fileId_idx; Type: INDEX; Schema: public; Owner: licer
--

CREATE INDEX "TenderDocument_fileId_idx" ON public."TenderDocument" USING btree ("fileId");


--
-- Name: TenderDocument_tenderId_idx; Type: INDEX; Schema: public; Owner: licer
--

CREATE INDEX "TenderDocument_tenderId_idx" ON public."TenderDocument" USING btree ("tenderId");


--
-- Name: TenderDocument_type_idx; Type: INDEX; Schema: public; Owner: licer
--

CREATE INDEX "TenderDocument_type_idx" ON public."TenderDocument" USING btree (type);


--
-- Name: TenderItem_tenderId_idx; Type: INDEX; Schema: public; Owner: licer
--

CREATE INDEX "TenderItem_tenderId_idx" ON public."TenderItem" USING btree ("tenderId");


--
-- Name: Tender_bidDeadline_idx; Type: INDEX; Schema: public; Owner: licer
--

CREATE INDEX "Tender_bidDeadline_idx" ON public."Tender" USING btree ("bidDeadline");


--
-- Name: Tender_buyerId_idx; Type: INDEX; Schema: public; Owner: licer
--

CREATE INDEX "Tender_buyerId_idx" ON public."Tender" USING btree ("buyerId");


--
-- Name: Tender_code_key; Type: INDEX; Schema: public; Owner: licer
--

CREATE UNIQUE INDEX "Tender_code_key" ON public."Tender" USING btree (code);


--
-- Name: Tender_requestingAreaId_idx; Type: INDEX; Schema: public; Owner: licer
--

CREATE INDEX "Tender_requestingAreaId_idx" ON public."Tender" USING btree ("requestingAreaId");


--
-- Name: Tender_status_idx; Type: INDEX; Schema: public; Owner: licer
--

CREATE INDEX "Tender_status_idx" ON public."Tender" USING btree (status);


--
-- Name: UserRole_roleId_idx; Type: INDEX; Schema: public; Owner: licer
--

CREATE INDEX "UserRole_roleId_idx" ON public."UserRole" USING btree ("roleId");


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: licer
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: User_status_idx; Type: INDEX; Schema: public; Owner: licer
--

CREATE INDEX "User_status_idx" ON public."User" USING btree (status);


--
-- Name: User_supplierId_idx; Type: INDEX; Schema: public; Owner: licer
--

CREATE INDEX "User_supplierId_idx" ON public."User" USING btree ("supplierId");


--
-- Name: Answer Answer_authorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: licer
--

ALTER TABLE ONLY public."Answer"
    ADD CONSTRAINT "Answer_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Answer Answer_questionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: licer
--

ALTER TABLE ONLY public."Answer"
    ADD CONSTRAINT "Answer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES public."Question"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Answer Answer_tenderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: licer
--

ALTER TABLE ONLY public."Answer"
    ADD CONSTRAINT "Answer_tenderId_fkey" FOREIGN KEY ("tenderId") REFERENCES public."Tender"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: AuditLog AuditLog_actorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: licer
--

ALTER TABLE ONLY public."AuditLog"
    ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Award Award_approvedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: licer
--

ALTER TABLE ONLY public."Award"
    ADD CONSTRAINT "Award_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Award Award_bidId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: licer
--

ALTER TABLE ONLY public."Award"
    ADD CONSTRAINT "Award_bidId_fkey" FOREIGN KEY ("bidId") REFERENCES public."Bid"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Award Award_supplierId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: licer
--

ALTER TABLE ONLY public."Award"
    ADD CONSTRAINT "Award_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES public."Supplier"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Award Award_tenderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: licer
--

ALTER TABLE ONLY public."Award"
    ADD CONSTRAINT "Award_tenderId_fkey" FOREIGN KEY ("tenderId") REFERENCES public."Tender"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: BidDocument BidDocument_bidId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: licer
--

ALTER TABLE ONLY public."BidDocument"
    ADD CONSTRAINT "BidDocument_bidId_fkey" FOREIGN KEY ("bidId") REFERENCES public."Bid"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: BidDocument BidDocument_fileId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: licer
--

ALTER TABLE ONLY public."BidDocument"
    ADD CONSTRAINT "BidDocument_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES public."FileObject"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: BidItem BidItem_bidId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: licer
--

ALTER TABLE ONLY public."BidItem"
    ADD CONSTRAINT "BidItem_bidId_fkey" FOREIGN KEY ("bidId") REFERENCES public."Bid"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: BidItem BidItem_tenderItemId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: licer
--

ALTER TABLE ONLY public."BidItem"
    ADD CONSTRAINT "BidItem_tenderItemId_fkey" FOREIGN KEY ("tenderItemId") REFERENCES public."TenderItem"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Bid Bid_replacedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: licer
--

ALTER TABLE ONLY public."Bid"
    ADD CONSTRAINT "Bid_replacedById_fkey" FOREIGN KEY ("replacedById") REFERENCES public."Bid"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Bid Bid_supplierId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: licer
--

ALTER TABLE ONLY public."Bid"
    ADD CONSTRAINT "Bid_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES public."Supplier"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Bid Bid_tenderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: licer
--

ALTER TABLE ONLY public."Bid"
    ADD CONSTRAINT "Bid_tenderId_fkey" FOREIGN KEY ("tenderId") REFERENCES public."Tender"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Bid Bid_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: licer
--

ALTER TABLE ONLY public."Bid"
    ADD CONSTRAINT "Bid_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: EvaluationCriteria EvaluationCriteria_tenderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: licer
--

ALTER TABLE ONLY public."EvaluationCriteria"
    ADD CONSTRAINT "EvaluationCriteria_tenderId_fkey" FOREIGN KEY ("tenderId") REFERENCES public."Tender"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: EvaluationScore EvaluationScore_bidId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: licer
--

ALTER TABLE ONLY public."EvaluationScore"
    ADD CONSTRAINT "EvaluationScore_bidId_fkey" FOREIGN KEY ("bidId") REFERENCES public."Bid"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: EvaluationScore EvaluationScore_criteriaId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: licer
--

ALTER TABLE ONLY public."EvaluationScore"
    ADD CONSTRAINT "EvaluationScore_criteriaId_fkey" FOREIGN KEY ("criteriaId") REFERENCES public."EvaluationCriteria"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: EvaluationScore EvaluationScore_evaluatorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: licer
--

ALTER TABLE ONLY public."EvaluationScore"
    ADD CONSTRAINT "EvaluationScore_evaluatorId_fkey" FOREIGN KEY ("evaluatorId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: FileObject FileObject_uploadedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: licer
--

ALTER TABLE ONLY public."FileObject"
    ADD CONSTRAINT "FileObject_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Notification Notification_supplierId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: licer
--

ALTER TABLE ONLY public."Notification"
    ADD CONSTRAINT "Notification_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES public."Supplier"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Notification Notification_tenderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: licer
--

ALTER TABLE ONLY public."Notification"
    ADD CONSTRAINT "Notification_tenderId_fkey" FOREIGN KEY ("tenderId") REFERENCES public."Tender"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Notification Notification_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: licer
--

ALTER TABLE ONLY public."Notification"
    ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Question Question_supplierId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: licer
--

ALTER TABLE ONLY public."Question"
    ADD CONSTRAINT "Question_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES public."Supplier"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Question Question_tenderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: licer
--

ALTER TABLE ONLY public."Question"
    ADD CONSTRAINT "Question_tenderId_fkey" FOREIGN KEY ("tenderId") REFERENCES public."Tender"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Question Question_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: licer
--

ALTER TABLE ONLY public."Question"
    ADD CONSTRAINT "Question_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: RolePermission RolePermission_permissionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: licer
--

ALTER TABLE ONLY public."RolePermission"
    ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES public."Permission"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: RolePermission RolePermission_roleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: licer
--

ALTER TABLE ONLY public."RolePermission"
    ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES public."Role"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SupplierDocument SupplierDocument_fileId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: licer
--

ALTER TABLE ONLY public."SupplierDocument"
    ADD CONSTRAINT "SupplierDocument_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES public."FileObject"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: SupplierDocument SupplierDocument_supplierId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: licer
--

ALTER TABLE ONLY public."SupplierDocument"
    ADD CONSTRAINT "SupplierDocument_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES public."Supplier"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: TenderDocument TenderDocument_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: licer
--

ALTER TABLE ONLY public."TenderDocument"
    ADD CONSTRAINT "TenderDocument_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: TenderDocument TenderDocument_fileId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: licer
--

ALTER TABLE ONLY public."TenderDocument"
    ADD CONSTRAINT "TenderDocument_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES public."FileObject"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: TenderDocument TenderDocument_tenderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: licer
--

ALTER TABLE ONLY public."TenderDocument"
    ADD CONSTRAINT "TenderDocument_tenderId_fkey" FOREIGN KEY ("tenderId") REFERENCES public."Tender"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: TenderItem TenderItem_tenderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: licer
--

ALTER TABLE ONLY public."TenderItem"
    ADD CONSTRAINT "TenderItem_tenderId_fkey" FOREIGN KEY ("tenderId") REFERENCES public."Tender"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Tender Tender_buyerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: licer
--

ALTER TABLE ONLY public."Tender"
    ADD CONSTRAINT "Tender_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Tender Tender_requestingAreaId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: licer
--

ALTER TABLE ONLY public."Tender"
    ADD CONSTRAINT "Tender_requestingAreaId_fkey" FOREIGN KEY ("requestingAreaId") REFERENCES public."RequestingArea"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: UserRole UserRole_roleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: licer
--

ALTER TABLE ONLY public."UserRole"
    ADD CONSTRAINT "UserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES public."Role"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: UserRole UserRole_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: licer
--

ALTER TABLE ONLY public."UserRole"
    ADD CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: User User_supplierId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: licer
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES public."Supplier"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict P4aebuH40cZMIHhrtJ2X8Ls5L2lagpLCJE16AQ52hOCyUWKv6i8fFBitzmuHNnD

