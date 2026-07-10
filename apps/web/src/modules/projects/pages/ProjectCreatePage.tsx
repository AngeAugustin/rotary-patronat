import { Navigate } from 'react-router-dom';

/** Ancienne page dédiée — la création se fait désormais via SlideOver sur la liste. */
export function ProjectCreatePage() {
  return <Navigate to="/dashboard/projets" replace />;
}
