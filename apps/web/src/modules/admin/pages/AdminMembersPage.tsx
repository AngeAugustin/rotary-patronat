import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Search, UserCircle } from 'lucide-react';
import { MEMBER_STATUS_LABELS } from '@rotary/shared-types';
import { fetchMembers } from '../api';
import { queryKeys } from '@/lib/query-keys';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  ResponsiveTable,
  dashboardTableClass,
  dashboardTableHeadClass,
  dashboardTableRowClass,
} from '@/components/ResponsiveTable';
import {
  DashboardPagination,
  DashboardEmptyState,
  DashboardSkeleton,
} from '@/modules/dashboard/components/layout';
import { adminTabPath } from '../constants/admin-nav';

function formatDate(date: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date));
}

export function AdminMembersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.admin.members(page, query),
    queryFn: () => fetchMembers(page, query || undefined),
  });

  return (
    <div className="space-y-6">
      <form
        className="dashboard-toolbar"
        onSubmit={(e) => {
          e.preventDefault();
          setQuery(search);
          setPage(1);
        }}
      >
        <Input
          placeholder="Rechercher par nom ou e-mail…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border-0 bg-transparent shadow-none focus-visible:ring-0 sm:flex-1"
        />
        <Button
          type="submit"
          variant="outline"
          size="sm"
          className="h-9 w-9 shrink-0 px-0"
          aria-label="Rechercher"
          title="Rechercher"
        >
          <Search className="h-4 w-4" aria-hidden />
        </Button>
      </form>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <DashboardSkeleton key={i} className="h-14" />
          ))}
        </div>
      ) : data?.data.length === 0 ? (
        <DashboardEmptyState
          message="Aucun membre trouvé"
          description="Les candidatures acceptées apparaîtront ici."
          icon={UserCircle}
        />
      ) : (
        <ResponsiveTable>
          <table className={dashboardTableClass}>
            <thead className={dashboardTableHeadClass}>
              <tr>
                <th className="px-4 py-3">Nom</th>
                <th className="px-4 py-3">E-mail</th>
                <th className="px-4 py-3">Profession</th>
                <th className="px-4 py-3">Adhésion</th>
                <th className="px-4 py-3">Compte</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data?.data.map((member) => (
                <tr key={member.id} className={dashboardTableRowClass}>
                  <td className="px-4 py-3 font-medium text-neutral-900">
                    {member.firstName} {member.lastName}
                  </td>
                  <td className="px-4 py-3 text-neutral-700">{member.email}</td>
                  <td className="px-4 py-3 text-neutral-700">{member.profession ?? '—'}</td>
                  <td className="px-4 py-3 text-neutral-700">{formatDate(member.joinedAt)}</td>
                  <td className="px-4 py-3">
                    <Badge variant={member.hasAccount ? 'success' : 'default'}>
                      {member.hasAccount ? 'Actif' : 'Sans compte'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={member.status === 'ACTIVE' ? 'success' : 'danger'}>
                      {MEMBER_STATUS_LABELS[member.status]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Button asChild variant="outline" size="sm">
                      <Link to={`${adminTabPath('membres')}/${member.id}`}>Voir la fiche</Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ResponsiveTable>
      )}

      {data && (
        <DashboardPagination
          page={data.meta.page}
          totalPages={data.meta.totalPages}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
