import { CardSkeleton, Skeleton, TableSkeleton } from '@/components/ui/Skeleton';

export default function AdminDashboardLoading() {
  return (
    <div className="max-w-screen-2xl mx-auto space-y-6 px-6 py-8">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-10 w-28 rounded-xl" />
      </div>
      <CardSkeleton />
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <Skeleton className="h-[320px] w-full rounded-2xl" />
        </div>
        <div className="lg:col-span-2">
          <Skeleton className="h-[320px] w-full rounded-2xl" />
        </div>
      </div>
      <TableSkeleton rows={5} columns={4} />
    </div>
  );
}
