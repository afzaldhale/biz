import { Skeleton, TableSkeleton } from '@/components/ui/Skeleton';

export default function DashboardModuleLoading() {
  return (
    <div className="max-w-screen-2xl mx-auto space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-80" />
      </div>
      <TableSkeleton rows={6} columns={6} />
    </div>
  );
}
