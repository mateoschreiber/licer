import { Navigate, Route, Routes } from 'react-router-dom';
import { LoginPage } from './modules/auth/LoginPage';
import { ResetPasswordPage } from './modules/auth/ResetPasswordPage';
import { ProtectedRoute } from './shared/auth/ProtectedRoute';
import { SupplierLayout } from './modules/supplier-portal/SupplierLayout';
import {
  AvailableTendersPage,
  CommunicationsPage,
  CreateBidPage,
  MyBidDetailPage,
  QuestionsAnswersPage,
  SubmissionReceiptPage,
  SupplierDocumentsPage,
  SupplierProfilePage,
  SupplierRegisterPage,
  TenderDetailPage,
  TenderDocumentsPage,
} from './modules/supplier-portal/SupplierPages';
import { InternalLayout } from './modules/internal-dashboard/InternalLayout';
import {
  AuditLogsPage,
  AwardCancelDesertPage,
  BidDetailInternalPage,
  BidsInboxPage,
  DashboardPage,
  DocumentsAddendasPage,
  DocumentalEvaluationPage,
  EconomicEvaluationPage,
  ExpedientePage,
  InternalComparisonPage,
  QuestionsInboxPage,
  RequestingAreasPage,
  SupplierDetailPage,
  SuppliersManagementPage,
  TechnicalEvaluationPage,
  TenderCreateEditPage,
  TenderDetailInternalPage,
  TendersManagementPage,
  UsersRolesPage,
} from './modules/internal-dashboard/InternalPages';

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
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
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
          <Route path="bids/new" element={<CreateBidPage />} />
          <Route path="bids/:id" element={<MyBidDetailPage />} />
          <Route path="receipt" element={<SubmissionReceiptPage />} />
          <Route path="communications" element={<CommunicationsPage />} />
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
          <Route path="tenders/:id" element={<TenderDetailInternalPage />} />
          <Route path="documents" element={<DocumentsAddendasPage />} />
          <Route path="questions" element={<QuestionsInboxPage />} />
          <Route path="bids" element={<BidsInboxPage />} />
          <Route path="bids/:id" element={<BidDetailInternalPage />} />
          <Route path="evaluation/documental" element={<DocumentalEvaluationPage />} />
          <Route path="evaluation/technical" element={<TechnicalEvaluationPage />} />
          <Route path="evaluation/economic" element={<EconomicEvaluationPage />} />
          <Route path="comparison" element={<InternalComparisonPage />} />
          <Route path="awards" element={<AwardCancelDesertPage />} />
          <Route path="expediente" element={<ExpedientePage />} />
          <Route path="audit" element={<AuditLogsPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
