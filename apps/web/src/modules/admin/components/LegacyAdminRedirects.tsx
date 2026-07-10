import { Navigate, useParams } from 'react-router-dom';

export function LegacyAdminCommissionRedirect() {
  const { id } = useParams();
  return <Navigate to={`/dashboard/administration/commissions/${id}`} replace />;
}
