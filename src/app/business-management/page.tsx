import { AdminAuthProvider } from '@/lib/adminAuth';
import BusinessManagementContent from './components/BusinessManagementContent';

export default function BusinessManagementPage() {
  return (
    <AdminAuthProvider>
      <BusinessManagementContent />
    </AdminAuthProvider>
  );
}
