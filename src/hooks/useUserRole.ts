import { useAuth } from '../context/AuthContext';

export function useUserRole() {
    const { user } = useAuth();

    const role = user?.role || 'viewer';

    const canEdit = role === 'admin' || role === 'manager'; 
    const isAdmin = role === 'admin';
    const isViewer = role === 'viewer';

    return { role, canEdit, isAdmin, isViewer };
}