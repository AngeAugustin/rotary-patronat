import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Users,
  Building2,
  FolderKanban,
  Megaphone,
  CalendarDays,
  Bell,
  MessageSquare,
  HeartHandshake,
  Clock,
} from 'lucide-react';
import { useCurrentUser } from '@/modules/auth/hooks/use-auth';
import { fetchDashboard } from '@/modules/admin/api';
import { queryKeys } from '@/lib/query-keys';
import { StatCard } from '../components/StatCard';
import { fadeInUp, staggerChildren } from '@/design-system/motion';
import { ROLE_LABELS, RoleCode } from '@rotary/shared-types';
import { useIsAdmin } from '@/hooks/use-role';
import {
  DashboardPageShell,
  DashboardPageHeader,
  DashboardSection,
  DashboardStatSkeletonGrid,
  DashboardPanel,
} from '../components/layout';

export function DashboardPage() {
  const { data: user } = useCurrentUser();
  const isAdmin = useIsAdmin();
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.dashboard.overview,
    queryFn: fetchDashboard,
  });

  if (isLoading) {
    return (
      <DashboardPageShell>
        <DashboardStatSkeletonGrid />
      </DashboardPageShell>
    );
  }

  return (
    <DashboardPageShell>
      <motion.div initial="hidden" animate="visible" variants={staggerChildren} className="space-y-8">
        <motion.div variants={fadeInUp}>
          <DashboardPageHeader
            eyebrow="Tableau de bord"
            title={`Bienvenue, ${user?.firstName}`}
            description={
              isAdmin
                ? "Vue d'ensemble du club et accès à l'administration."
                : 'Votre espace personnel au sein du Rotary Club Le Nautile Patronat.'
            }
          />
        </motion.div>

        {isAdmin && data?.global && (
          <motion.div variants={fadeInUp}>
            <DashboardSection title="Indicateurs globaux">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  label="Membres actifs"
                  value={data.global.members.active}
                  sublabel={`${data.global.members.total} au total`}
                  icon={Users}
                  variant="primary"
                />
                <StatCard
                  label="Commissions"
                  value={data.global.commissions.total}
                  sublabel={`${data.global.commissions.withLead} avec responsable`}
                  icon={Building2}
                />
                <StatCard
                  label="Actions publiées"
                  value={data.global.actions.published}
                  sublabel={`${data.global.actions.total} au total`}
                  icon={Megaphone}
                  variant="accent"
                />
                <StatCard
                  label="Projets en cours"
                  value={data.global.projects.inProgress}
                  sublabel={`${data.global.projects.total} au total · ${data.global.projects.averageProgress}% avancement moyen`}
                  icon={FolderKanban}
                />
              </div>
            </DashboardSection>
          </motion.div>
        )}

        {data?.commissionLead && (
          <motion.div variants={fadeInUp}>
            <DashboardPanel
              title={`Ma commission — ${data.commissionLead.commissionName}`}
              description="Vue responsable de commission"
            >
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard label="Membres" value={data.commissionLead.memberCount} icon={Users} />
                <StatCard label="Projets" value={data.commissionLead.projectsCount} icon={FolderKanban} />
                <StatCard label="En cours" value={data.commissionLead.activeProjects} />
                <StatCard label="Avancement moyen" value={`${data.commissionLead.averageProgress}%`} />
              </div>
            </DashboardPanel>
          </motion.div>
        )}

        {data?.member && (
          <motion.div variants={fadeInUp}>
            <DashboardSection title="Mon activité">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard label="Mes commissions" value={data.member.commissions} icon={Building2} />
                <StatCard label="Projets assignés" value={data.member.assignedProjects} icon={FolderKanban} />
                <StatCard label="Tâches en attente" value={data.member.pendingTasks} icon={Clock} />
                <StatCard
                  label="Réunions à venir"
                  value={data.member.upcomingMeetings}
                  icon={CalendarDays}
                  variant="accent"
                />
              </div>
              {(data.member.unreadNotifications !== undefined ||
                data.member.unreadMessages !== undefined) && (
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <StatCard
                    label="Notifications non lues"
                    value={data.member.unreadNotifications ?? 0}
                    icon={Bell}
                  />
                  <StatCard
                    label="Messages non lus"
                    value={data.member.unreadMessages ?? 0}
                    icon={MessageSquare}
                  />
                </div>
              )}
              {(data.member.volunteeringHours !== undefined ||
                data.member.upcomingCalendarEvents !== undefined) && (
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <StatCard
                    label="Heures de bénévolat"
                    value={`${data.member.volunteeringHours ?? 0} h`}
                    icon={HeartHandshake}
                    variant="primary"
                  />
                  <StatCard
                    label="Événements à venir"
                    value={data.member.upcomingCalendarEvents ?? 0}
                    icon={CalendarDays}
                  />
                </div>
              )}
            </DashboardSection>
          </motion.div>
        )}

        {user?.roles.includes(RoleCode.MEMBER) && !isAdmin && (
          <motion.p variants={fadeInUp} className="text-sm text-neutral-400">
            Rôle principal : {ROLE_LABELS[user.roles[0]]}
          </motion.p>
        )}
      </motion.div>
    </DashboardPageShell>
  );
}
