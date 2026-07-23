import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './shared/auth/ProtectedRoute';
import { LoadingState } from './shared/components/UiPrimitives';

const LoginPage = lazy(() =>
  import('./modules/auth/LoginPage').then((module) => ({ default: module.LoginPage })),
);
const ResetPasswordPage = lazy(() =>
  import('./modules/auth/ResetPasswordPage').then((module) => ({
    default: module.ResetPasswordPage,
  })),
);
const ChangePasswordPage = lazy(() =>
  import('./modules/auth/ChangePasswordPage').then((module) => ({
    default: module.ChangePasswordPage,
  })),
);
const InternalLayout = lazy(() =>
  import('./modules/internal-dashboard/InternalLayout').then((module) => ({
    default: module.InternalLayout,
  })),
);
const SupplierLayout = lazy(() =>
  import('./modules/supplier-portal/SupplierLayout').then((module) => ({
    default: module.SupplierLayout,
  })),
);
const NotFoundPage = lazy(() =>
  import('./shared/components/NotFoundPage').then((module) => ({ default: module.NotFoundPage })),
);

const internalPages = () => import('./modules/internal-dashboard/InternalPages');
const catalogPages = () => import('./modules/internal-dashboard/CatalogPages');
const supplierPages = () => import('./modules/supplier-portal/SupplierPages');

const DashboardPage = lazy(() =>
  internalPages().then((module) => ({ default: module.DashboardPage })),
);
const UsersRolesPage = lazy(() =>
  internalPages().then((module) => ({ default: module.UsersRolesPage })),
);
const RequestingAreasPage = lazy(() =>
  internalPages().then((module) => ({ default: module.RequestingAreasPage })),
);
const SuppliersManagementPage = lazy(() =>
  internalPages().then((module) => ({ default: module.SuppliersManagementPage })),
);
const SupplierDetailPage = lazy(() =>
  internalPages().then((module) => ({ default: module.SupplierDetailPage })),
);
const TendersManagementPage = lazy(() =>
  internalPages().then((module) => ({ default: module.TendersManagementPage })),
);
const TenderCreateEditPage = lazy(() =>
  internalPages().then((module) => ({ default: module.TenderCreateEditPage })),
);
const TenderCategoriesPage = lazy(() =>
  catalogPages().then((module) => ({ default: module.TenderCategoriesPage })),
);
const TenderBranchesPage = lazy(() =>
  catalogPages().then((module) => ({ default: module.TenderBranchesPage })),
);
const TenderDetailInternalPage = lazy(() =>
  internalPages().then((module) => ({ default: module.TenderDetailInternalPage })),
);
const QuestionsInboxPage = lazy(() =>
  internalPages().then((module) => ({ default: module.QuestionsInboxPage })),
);
const QuestionDetailInternalPage = lazy(() =>
  internalPages().then((module) => ({ default: module.QuestionDetailInternalPage })),
);
const BidsInboxPage = lazy(() =>
  internalPages().then((module) => ({ default: module.BidsInboxPage })),
);
const BidDetailInternalPage = lazy(() =>
  internalPages().then((module) => ({ default: module.BidDetailInternalPage })),
);
const AwardCancelDesertPage = lazy(() =>
  internalPages().then((module) => ({ default: module.AwardCancelDesertPage })),
);
const AuditLogsPage = lazy(() =>
  internalPages().then((module) => ({ default: module.AuditLogsPage })),
);

const SupplierRegisterPage = lazy(() =>
  supplierPages().then((module) => ({ default: module.SupplierRegisterPage })),
);
const SupplierProfilePage = lazy(() =>
  supplierPages().then((module) => ({ default: module.SupplierProfilePage })),
);
const SupplierDocumentsPage = lazy(() =>
  supplierPages().then((module) => ({ default: module.SupplierDocumentsPage })),
);
const AvailableTendersPage = lazy(() =>
  supplierPages().then((module) => ({ default: module.AvailableTendersPage })),
);
const TenderDetailPage = lazy(() =>
  supplierPages().then((module) => ({ default: module.TenderDetailPage })),
);
const TenderDocumentsPage = lazy(() =>
  supplierPages().then((module) => ({ default: module.TenderDocumentsPage })),
);
const QuestionsAnswersPage = lazy(() =>
  supplierPages().then((module) => ({ default: module.QuestionsAnswersPage })),
);
const SupplierQuestionDetailPage = lazy(() =>
  supplierPages().then((module) => ({ default: module.SupplierQuestionDetailPage })),
);
const CreateBidPage = lazy(() =>
  supplierPages().then((module) => ({ default: module.CreateBidPage })),
);
const MyBidDetailPage = lazy(() =>
  supplierPages().then((module) => ({ default: module.MyBidDetailPage })),
);
const SubmissionReceiptPage = lazy(() =>
  supplierPages().then((module) => ({ default: module.SubmissionReceiptPage })),
);

const internalRoles = [
  'ADMIN',
  'COMPRAS',
  'AREA_SOLICITANTE',
  'EVALUADOR_TECNICO',
  'EVALUADOR_ECONOMICO',
  'APROBADOR',
  'AUDITOR',
];

export function App() {
  return (
    <Suspense
      fallback={
        <main className="route-loading">
          <LoadingState label="Cargando pantalla" rows={5} />
        </main>
      }
    >
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/change-password" element={<ChangePasswordPage />} />
        <Route path="/supplier/register" element={<SupplierRegisterPage />} />

        <Route element={<ProtectedRoute roles={['PROVEEDOR']} />}>
          <Route path="/supplier" element={<SupplierLayout />}>
            <Route index element={<Navigate to="tenders" replace />} />
            <Route path="profile" element={<SupplierProfilePage />} />
            <Route path="documents" element={<SupplierDocumentsPage />} />
            <Route path="tenders" element={<AvailableTendersPage />} />
            <Route path="tenders/:id" element={<TenderDetailPage />} />
            <Route path="tenders/:id/documents" element={<TenderDocumentsPage />} />
            <Route path="questions" element={<QuestionsAnswersPage />} />
            <Route path="questions/:id" element={<SupplierQuestionDetailPage />} />
            <Route path="bids/new" element={<CreateBidPage />} />
            <Route path="bids/:id" element={<MyBidDetailPage />} />
            <Route path="receipt" element={<SubmissionReceiptPage />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute roles={internalRoles} />}>
          <Route path="/internal" element={<InternalLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="users-roles" element={<UsersRolesPage />} />
            <Route path="requesting-areas" element={<RequestingAreasPage />} />
            <Route path="suppliers" element={<SuppliersManagementPage />} />
            <Route path="suppliers/:id" element={<SupplierDetailPage />} />
            <Route path="tenders" element={<TendersManagementPage />} />
            <Route path="tenders/new" element={<TenderCreateEditPage />} />
            <Route path="tenders/categories" element={<TenderCategoriesPage />} />
            <Route path="tenders/branches" element={<TenderBranchesPage />} />
            <Route path="tenders/:id" element={<TenderDetailInternalPage />} />
            <Route path="questions" element={<QuestionsInboxPage />} />
            <Route path="questions/:id" element={<QuestionDetailInternalPage />} />
            <Route path="bids" element={<BidsInboxPage />} />
            <Route path="bids/:id" element={<BidDetailInternalPage />} />
            <Route path="awards" element={<AwardCancelDesertPage />} />
            <Route
              path="expediente"
              element={<Navigate to="/internal/audit?tab=expediente" replace />}
            />
            <Route path="audit" element={<AuditLogsPage />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
