import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { RoleCode } from '@rotary/shared-types';
import { ScrollToTop } from '@/components/ScrollToTop';
import { LoginPage } from '@/modules/auth/pages/LoginPage';
import { ForgotPasswordPage } from '@/modules/auth/pages/ForgotPasswordPage';
import { VerifyResetOtpPage } from '@/modules/auth/pages/VerifyResetOtpPage';
import { ResetPasswordPage } from '@/modules/auth/pages/ResetPasswordPage';
import { ProtectedRoute } from './ProtectedRoute';
import { RequireRole } from './RequireRole';
import { PublicLayout } from '@/modules/public/layouts/PublicLayout';
import { DashboardLayout } from '@/modules/dashboard/layouts/DashboardLayout';
import { LegacyAdminCommissionRedirect } from '@/modules/admin/components/LegacyAdminRedirects';

const HomePage = lazy(() =>
  import('@/modules/public/pages/HomePage').then((m) => ({ default: m.HomePage })),
);
const ClubPage = lazy(() =>
  import('@/modules/public/pages/ClubPage').then((m) => ({ default: m.ClubPage })),
);
const ClubPresidentPage = lazy(() =>
  import('@/modules/public/pages/ClubPresidentPage').then((m) => ({
    default: m.ClubPresidentPage,
  })),
);
const PublicCommissionDetailPage = lazy(() =>
  import('@/modules/public/pages/PublicCommissionDetailPage').then((m) => ({
    default: m.PublicCommissionDetailPage,
  })),
);
const RiPresidentObjectivesPage = lazy(() =>
  import('@/modules/public/pages/RiPresidentObjectivesPage').then((m) => ({
    default: m.RiPresidentObjectivesPage,
  })),
);
const ActionsPage = lazy(() =>
  import('@/modules/public/pages/ActionsPage').then((m) => ({ default: m.ActionsPage })),
);
const ActionDetailPage = lazy(() =>
  import('@/modules/public/pages/ActionDetailPage').then((m) => ({
    default: m.ActionDetailPage,
  })),
);
const NewsPage = lazy(() =>
  import('@/modules/public/pages/NewsPage').then((m) => ({ default: m.NewsPage })),
);
const NewsDetailPage = lazy(() =>
  import('@/modules/public/pages/NewsDetailPage').then((m) => ({
    default: m.NewsDetailPage,
  })),
);
const MeetingsPage = lazy(() =>
  import('@/modules/public/pages/MeetingsPage').then((m) => ({
    default: m.MeetingsPage,
  })),
);
const MeetingDetailPage = lazy(() =>
  import('@/modules/public/pages/MeetingDetailPage').then((m) => ({
    default: m.MeetingDetailPage,
  })),
);
const PublicLibraryPage = lazy(() =>
  import('@/modules/public/pages/PublicLibraryPage').then((m) => ({
    default: m.PublicLibraryPage,
  })),
);
const JoinPage = lazy(() =>
  import('@/modules/public/pages/JoinPage').then((m) => ({
    default: m.JoinPage,
  })),
);
const DashboardPage = lazy(() =>
  import('@/modules/dashboard/pages/DashboardPage').then((m) => ({
    default: m.DashboardPage,
  })),
);
const ProfilePage = lazy(() =>
  import('@/modules/dashboard/pages/ProfilePage').then((m) => ({
    default: m.ProfilePage,
  })),
);
const AdminLayout = lazy(() =>
  import('@/modules/admin/layouts/AdminLayout').then((m) => ({
    default: m.AdminLayout,
  })),
);
const AdminUsersPage = lazy(() =>
  import('@/modules/admin/pages/AdminUsersPage').then((m) => ({
    default: m.AdminUsersPage,
  })),
);
const AdminCommissionsPage = lazy(() =>
  import('@/modules/admin/pages/AdminCommissionsPage').then((m) => ({
    default: m.AdminCommissionsPage,
  })),
);
const AdminCommissionDetailPage = lazy(() =>
  import('@/modules/admin/pages/AdminCommissionDetailPage').then((m) => ({
    default: m.AdminCommissionDetailPage,
  })),
);
const AdminLogsPage = lazy(() =>
  import('@/modules/admin/pages/AdminLogsPage').then((m) => ({
    default: m.AdminLogsPage,
  })),
);
const ProjectsListPage = lazy(() =>
  import('@/modules/projects/pages/ProjectsListPage').then((m) => ({
    default: m.ProjectsListPage,
  })),
);
const ProjectDetailPage = lazy(() =>
  import('@/modules/projects/pages/ProjectDetailPage').then((m) => ({
    default: m.ProjectDetailPage,
  })),
);
const ProjectCreatePage = lazy(() =>
  import('@/modules/projects/pages/ProjectCreatePage').then((m) => ({
    default: m.ProjectCreatePage,
  })),
);
const FeedPage = lazy(() =>
  import('@/modules/feed/pages/FeedPage').then((m) => ({ default: m.FeedPage })),
);
const MessagingPage = lazy(() =>
  import('@/modules/messaging/pages/MessagingPage').then((m) => ({
    default: m.MessagingPage,
  })),
);
const VolunteeringPage = lazy(() =>
  import('@/modules/volunteering/pages/VolunteeringPage').then((m) => ({
    default: m.VolunteeringPage,
  })),
);
const CalendarPage = lazy(() =>
  import('@/modules/calendar/pages/CalendarPage').then((m) => ({
    default: m.CalendarPage,
  })),
);
const CalendarEventDetailPage = lazy(() =>
  import('@/modules/calendar/pages/CalendarEventDetailPage').then((m) => ({
    default: m.CalendarEventDetailPage,
  })),
);
const AdminVolunteeringPage = lazy(() =>
  import('@/modules/volunteering/pages/AdminVolunteeringPage').then((m) => ({
    default: m.AdminVolunteeringPage,
  })),
);
const AdminModerationPage = lazy(() =>
  import('@/modules/admin/pages/AdminModerationPage').then((m) => ({
    default: m.AdminModerationPage,
  })),
);
const AdminMembershipPage = lazy(() =>
  import('@/modules/admin/pages/AdminMembershipPage').then((m) => ({
    default: m.AdminMembershipPage,
  })),
);
const AdminMembershipDetailPage = lazy(() =>
  import('@/modules/admin/pages/AdminMembershipDetailPage').then((m) => ({
    default: m.AdminMembershipDetailPage,
  })),
);
const AdminMembersPage = lazy(() =>
  import('@/modules/admin/pages/AdminMembersPage').then((m) => ({
    default: m.AdminMembersPage,
  })),
);
const AdminMemberDetailPage = lazy(() =>
  import('@/modules/admin/pages/AdminMemberDetailPage').then((m) => ({
    default: m.AdminMemberDetailPage,
  })),
);
const AdminActionsPage = lazy(() =>
  import('@/modules/admin/pages/AdminActionsPage').then((m) => ({
    default: m.AdminActionsPage,
  })),
);
const AdminActionDetailPage = lazy(() =>
  import('@/modules/admin/pages/AdminActionDetailPage').then((m) => ({
    default: m.AdminActionDetailPage,
  })),
);
const AdminNewsPage = lazy(() =>
  import('@/modules/admin/pages/AdminNewsPage').then((m) => ({
    default: m.AdminNewsPage,
  })),
);
const AdminNewsDetailPage = lazy(() =>
  import('@/modules/admin/pages/AdminNewsDetailPage').then((m) => ({
    default: m.AdminNewsDetailPage,
  })),
);
const LibraryPage = lazy(() =>
  import('@/modules/library/pages/LibraryPage').then((m) => ({
    default: m.LibraryPage,
  })),
);
const SearchPage = lazy(() =>
  import('@/modules/search/pages/SearchPage').then((m) => ({
    default: m.SearchPage,
  })),
);
const NotificationsPage = lazy(() =>
  import('@/modules/notifications/pages/NotificationsPage').then((m) => ({
    default: m.NotificationsPage,
  })),
);

function PageLoader() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="h-8 w-48 animate-pulse rounded-xl bg-neutral-100" />
    </div>
  );
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/le-club" element={<ClubPage />} />
            <Route path="/le-club/president" element={<ClubPresidentPage />} />
            <Route
              path="/le-club/commissions/:slug"
              element={<PublicCommissionDetailPage />}
            />
            <Route
              path="/le-club/president-ri/objectifs"
              element={<RiPresidentObjectivesPage />}
            />
            <Route path="/nos-actions" element={<ActionsPage />} />
            <Route path="/nos-actions/:slug" element={<ActionDetailPage />} />
            <Route path="/nos-actualites" element={<NewsPage />} />
            <Route path="/nos-actualites/:slug" element={<NewsDetailPage />} />
            <Route path="/nos-reunions" element={<MeetingsPage />} />
            <Route path="/nos-reunions/:slug" element={<MeetingDetailPage />} />
            <Route path="/bibliotheque" element={<PublicLibraryPage />} />
            <Route path="/nous-rejoindre" element={<JoinPage />} />
          </Route>
          <Route path="/connexion" element={<LoginPage />} />
          <Route path="/mot-de-passe-oublie" element={<ForgotPasswordPage />} />
          <Route path="/mot-de-passe-oublie/otp" element={<VerifyResetOtpPage />} />
          <Route path="/mot-de-passe-oublie/nouveau" element={<ResetPasswordPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/dashboard/profil" element={<ProfilePage />} />
              <Route path="/dashboard/fil" element={<FeedPage />} />
              <Route path="/dashboard/messagerie" element={<MessagingPage />} />
              <Route path="/dashboard/calendrier" element={<CalendarPage />} />
              <Route
                path="/dashboard/calendrier/:id"
                element={<CalendarEventDetailPage />}
              />
              <Route path="/dashboard/benevolat" element={<VolunteeringPage />} />
              <Route path="/dashboard/bibliotheque" element={<LibraryPage />} />
              <Route path="/dashboard/recherche" element={<SearchPage />} />
              <Route path="/dashboard/notifications" element={<NotificationsPage />} />
              <Route path="/dashboard/projets" element={<ProjectsListPage />} />
              <Route path="/dashboard/projets/nouveau" element={<ProjectCreatePage />} />
              <Route path="/dashboard/projets/:id" element={<ProjectDetailPage />} />
              <Route element={<RequireRole minRole={RoleCode.ADMIN} />}>
                <Route element={<AdminLayout />}>
                  <Route
                    path="/dashboard/administration"
                    element={<Navigate to="/dashboard/administration/utilisateurs" replace />}
                  />
                  <Route path="/dashboard/administration/utilisateurs" element={<AdminUsersPage />} />
                  <Route path="/dashboard/administration/membres" element={<AdminMembersPage />} />
                  <Route
                    path="/dashboard/administration/membres/:id"
                    element={<AdminMemberDetailPage />}
                  />
                  <Route path="/dashboard/administration/commissions" element={<AdminCommissionsPage />} />
                  <Route
                    path="/dashboard/administration/commissions/:id"
                    element={<AdminCommissionDetailPage />}
                  />
                  <Route path="/dashboard/administration/actions" element={<AdminActionsPage />} />
                  <Route
                    path="/dashboard/administration/actions/:id"
                    element={<AdminActionDetailPage />}
                  />
                  <Route path="/dashboard/administration/actualites" element={<AdminNewsPage />} />
                  <Route
                    path="/dashboard/administration/actualites/:id"
                    element={<AdminNewsDetailPage />}
                  />
                  <Route path="/dashboard/administration/journal" element={<AdminLogsPage />} />
                  <Route path="/dashboard/administration/benevolat" element={<AdminVolunteeringPage />} />
                  <Route path="/dashboard/administration/moderation" element={<AdminModerationPage />} />
                  <Route path="/dashboard/administration/adhesions" element={<AdminMembershipPage />} />
                  <Route
                    path="/dashboard/administration/adhesions/:id"
                    element={<AdminMembershipDetailPage />}
                  />
                </Route>
                <Route path="/dashboard/admin/utilisateurs" element={<Navigate to="/dashboard/administration/utilisateurs" replace />} />
                <Route path="/dashboard/admin/membres" element={<Navigate to="/dashboard/administration/membres" replace />} />
                <Route path="/dashboard/admin/commissions" element={<Navigate to="/dashboard/administration/commissions" replace />} />
                <Route path="/dashboard/admin/commissions/:id" element={<LegacyAdminCommissionRedirect />} />
                <Route path="/dashboard/admin/journal" element={<Navigate to="/dashboard/administration/journal" replace />} />
                <Route path="/dashboard/admin/statistiques" element={<Navigate to="/dashboard/administration/utilisateurs" replace />} />
                <Route path="/dashboard/admin/benevolat" element={<Navigate to="/dashboard/administration/benevolat" replace />} />
                <Route path="/dashboard/admin/moderation" element={<Navigate to="/dashboard/administration/moderation" replace />} />
                <Route path="/dashboard/admin/adhesions" element={<Navigate to="/dashboard/administration/adhesions" replace />} />
              </Route>
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
