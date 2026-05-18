'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '@/lib/adminAuth';
import AdminLayout from '@/components/admin/AdminLayout';
import BusinessFilters from './BusinessFilters';
import BusinessTable from './BusinessTable';
import BusinessDetailDrawer from './BusinessDetailDrawer';
import BusinessStatusModal from './BusinessStatusModal';
import BusinessPlanModal from './BusinessPlanModal';
import AdminConfirmDialog from '@/components/admin/AdminConfirmDialog';
import { MOCK_BUSINESSES, Business, BusinessStatus, PlanType } from '@/lib/mockData';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';

export type SortField = 'businessName' | 'createdAt' | 'plan' | 'status' | 'usageCount';
export type SortDir = 'asc' | 'desc';

export default function BusinessManagementContent() {
  const { admin } = useAdminAuth();
  const router = useRouter();

  const [businesses, setBusinesses] = React.useState<Business[]>(MOCK_BUSINESSES);
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<BusinessStatus | 'all'>('all');
  const [planFilter, setPlanFilter] = React.useState<PlanType | 'all'>('all');
  const [industryFilter, setIndustryFilter] = React.useState<string>('all');
  const [sortField, setSortField] = React.useState<SortField>('createdAt');
  const [sortDir, setSortDir] = React.useState<SortDir>('desc');
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(8);
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());

  // Drawer / Modal state
  const [drawerBiz, setDrawerBiz] = React.useState<Business | null>(null);
  const [statusModalBiz, setStatusModalBiz] = React.useState<Business | null>(null);
  const [planModalBiz, setPlanModalBiz] = React.useState<Business | null>(null);
  const [suspendConfirm, setSuspendConfirm] = React.useState<Business | null>(null);
  const [deleteConfirm, setDeleteConfirm] = React.useState<Business | null>(null);
  const [actionLoading, setActionLoading] = React.useState(false);

  // BACKEND INTEGRATION POINT: Replace local state with getAllBusinesses() from adminBusinessService.ts

  if (!admin) {
    return (
      <div className="min-h-screen flex items-center justify-center admin-bg-pattern">
        <div className="text-center p-8 bg-card border border-border rounded-2xl shadow-card max-w-sm">
          <h2 className="text-lg font-700 text-foreground mb-2">Access Denied</h2>
          <p className="text-sm text-muted-foreground mb-5">
            This area is restricted to BizManage administrators.
          </p>
          <button
            onClick={() => router.push('/admin-login')}
            className="btn-primary px-5 py-2.5 rounded-xl text-sm font-600 w-full"
          >
            Go to Admin Login
          </button>
        </div>
      </div>
    );
  }

  // Filtering
  const filtered = businesses.filter((b) => {
    const matchSearch =
      search === '' ||
      b.businessName.toLowerCase().includes(search.toLowerCase()) ||
      b.ownerName.toLowerCase().includes(search.toLowerCase()) ||
      b.email.toLowerCase().includes(search.toLowerCase()) ||
      b.city.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || b.status === statusFilter;
    const matchPlan = planFilter === 'all' || b.plan === planFilter;
    const matchIndustry = industryFilter === 'all' || b.industry === industryFilter;
    return matchSearch && matchStatus && matchPlan && matchIndustry;
  });

  // Sorting
  const sorted = [...filtered].sort((a, b) => {
    let av: string | number = '';
    let bv: string | number = '';
    if (sortField === 'businessName') {
      av = a.businessName;
      bv = b.businessName;
    } else if (sortField === 'createdAt') {
      av = a.createdAt;
      bv = b.createdAt;
    } else if (sortField === 'plan') {
      av = a.plan;
      bv = b.plan;
    } else if (sortField === 'status') {
      av = a.status;
      bv = b.status;
    } else if (sortField === 'usageCount') {
      av = a.usageCount;
      bv = b.usageCount;
    }
    if (av < bv) return sortDir === 'asc' ? -1 : 1;
    if (av > bv) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sorted.length / pageSize);
  const paginated = sorted.slice((page - 1) * pageSize, page * pageSize);

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const handleStatusChange = async (biz: Business, newStatus: BusinessStatus) => {
    setActionLoading(true);
    await new Promise((r) => setTimeout(r, 900));
    // BACKEND INTEGRATION POINT: updateBusinessStatus(biz.id, newStatus) from adminBusinessService.ts
    setBusinesses((prev) => prev.map((b) => (b.id === biz.id ? { ...b, status: newStatus } : b)));
    setActionLoading(false);
    setStatusModalBiz(null);
    toast.success(`${biz.businessName} status updated to ${newStatus.replace('_', ' ')}`);
  };

  const handlePlanChange = async (biz: Business, newPlan: PlanType) => {
    setActionLoading(true);
    await new Promise((r) => setTimeout(r, 900));
    // BACKEND INTEGRATION POINT: updateBusinessPlan(biz.id, newPlan) from adminBusinessService.ts
    setBusinesses((prev) => prev.map((b) => (b.id === biz.id ? { ...b, plan: newPlan } : b)));
    setActionLoading(false);
    setPlanModalBiz(null);
    toast.success(`${biz.businessName} plan updated to ${newPlan}`);
  };

  const handleSuspend = async () => {
    if (!suspendConfirm) return;
    setActionLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setBusinesses((prev) =>
      prev.map((b) => (b.id === suspendConfirm.id ? { ...b, status: 'suspended' } : b))
    );
    setActionLoading(false);
    setSuspendConfirm(null);
    toast.success(`${suspendConfirm.businessName} has been suspended`);
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setActionLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setBusinesses((prev) => prev.filter((b) => b.id !== deleteConfirm.id));
    setActionLoading(false);
    setDeleteConfirm(null);
    toast.success(`${deleteConfirm.businessName} archived successfully`);
  };

  const pendingCount = businesses.filter((b) => b.status === 'pending_verification').length;

  return (
    <AdminLayout currentPath="/business-management">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-800 text-foreground">Business Management</h1>
            {pendingCount > 0 && (
              <span className="px-2.5 py-1 rounded-full text-xs font-700 bg-amber-100 text-amber-700 border border-amber-200">
                {pendingCount} pending verification
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {businesses.length} total businesses — {filtered.length} matching current filters
          </p>
        </div>
        <button className="flex items-center gap-2 btn-primary px-4 py-2.5 rounded-xl text-sm font-600">
          <Plus size={15} />
          Add Business
        </button>
      </div>

      {/* Main card */}
      <div className="bg-card border border-border rounded-2xl shadow-card overflow-hidden">
        {/* Filters */}
        <BusinessFilters
          search={search}
          onSearchChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          statusFilter={statusFilter}
          onStatusChange={(v) => {
            setStatusFilter(v as BusinessStatus | 'all');
            setPage(1);
          }}
          planFilter={planFilter}
          onPlanChange={(v) => {
            setPlanFilter(v as PlanType | 'all');
            setPage(1);
          }}
          industryFilter={industryFilter}
          onIndustryChange={(v) => {
            setIndustryFilter(v);
            setPage(1);
          }}
          totalFiltered={filtered.length}
          selectedCount={selectedIds.size}
          onClearFilters={() => {
            setSearch('');
            setStatusFilter('all');
            setPlanFilter('all');
            setIndustryFilter('all');
            setPage(1);
          }}
        />

        {/* Table */}
        <BusinessTable
          businesses={paginated}
          allBusinesses={sorted}
          selectedIds={selectedIds}
          onSelectIds={setSelectedIds}
          sortField={sortField}
          sortDir={sortDir}
          onSort={handleSort}
          onViewDetail={setDrawerBiz}
          onChangeStatus={setStatusModalBiz}
          onChangePlan={setPlanModalBiz}
          onSuspend={setSuspendConfirm}
          onDelete={setDeleteConfirm}
        />

        {/* Pagination */}
        <BusinessPagination
          page={page}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={sorted.length}
          onPageChange={setPage}
          onPageSizeChange={(v) => {
            setPageSize(v);
            setPage(1);
          }}
        />
      </div>

      {/* Modals & Drawers */}
      {drawerBiz && (
        <BusinessDetailDrawer
          business={drawerBiz}
          onClose={() => setDrawerBiz(null)}
          onChangeStatus={() => {
            setStatusModalBiz(drawerBiz);
            setDrawerBiz(null);
          }}
          onChangePlan={() => {
            setPlanModalBiz(drawerBiz);
            setDrawerBiz(null);
          }}
        />
      )}

      {statusModalBiz && (
        <BusinessStatusModal
          business={statusModalBiz}
          loading={actionLoading}
          onConfirm={(newStatus) => handleStatusChange(statusModalBiz, newStatus)}
          onClose={() => setStatusModalBiz(null)}
        />
      )}

      {planModalBiz && (
        <BusinessPlanModal
          business={planModalBiz}
          loading={actionLoading}
          onConfirm={(newPlan) => handlePlanChange(planModalBiz, newPlan)}
          onClose={() => setPlanModalBiz(null)}
        />
      )}

      <AdminConfirmDialog
        open={!!suspendConfirm}
        title={`Suspend ${suspendConfirm?.businessName ?? 'this business'}?`}
        description="Suspending will immediately block all users of this business from accessing BizManage. This action can be reversed by activating the business again."
        confirmLabel="Suspend Business"
        variant="danger"
        loading={actionLoading}
        onConfirm={handleSuspend}
        onCancel={() => setSuspendConfirm(null)}
      />

      <AdminConfirmDialog
        open={!!deleteConfirm}
        title={`Archive ${deleteConfirm?.businessName ?? 'this business'}?`}
        description="Archiving will soft-delete this business and all associated data. The business will no longer appear in active lists. This action is permanent and cannot be undone."
        confirmLabel="Archive Business"
        variant="danger"
        loading={actionLoading}
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm(null)}
      />
    </AdminLayout>
  );
}

// Pagination component (inline — tightly coupled to this screen)
interface BusinessPaginationProps {
  page: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (p: number) => void;
  onPageSizeChange: (s: number) => void;
}

function BusinessPagination({
  page,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
}: BusinessPaginationProps) {
  const startItem = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, totalItems);

  const pageNumbers: number[] = [];
  const delta = 2;
  for (let i = Math.max(1, page - delta); i <= Math.min(totalPages, page + delta); i++) {
    pageNumbers.push(i);
  }

  return (
    <div className="px-6 py-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground">
          Showing{' '}
          <span className="font-700 text-foreground">
            {startItem}–{endItem}
          </span>{' '}
          of <span className="font-700 text-foreground">{totalItems}</span> businesses
        </span>
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground">Rows:</label>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="text-xs border border-border rounded-lg px-2 py-1.5 bg-muted/40 focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground"
          >
            {[5, 8, 10, 20].map((s) => (
              <option key={`pagesize-${s}`} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(1)}
          disabled={page === 1}
          className="px-2.5 py-1.5 text-xs font-600 rounded-lg border border-border hover:bg-muted/60 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="First page"
        >
          «
        </button>
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="px-2.5 py-1.5 text-xs font-600 rounded-lg border border-border hover:bg-muted/60 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Previous page"
        >
          ‹
        </button>

        {pageNumbers[0] > 1 && (
          <>
            <button
              onClick={() => onPageChange(1)}
              className="px-2.5 py-1.5 text-xs font-600 rounded-lg border border-border hover:bg-muted/60 transition-colors"
            >
              1
            </button>
            {pageNumbers[0] > 2 && <span className="px-1 text-muted-foreground text-xs">…</span>}
          </>
        )}

        {pageNumbers.map((n) => (
          <button
            key={`page-${n}`}
            onClick={() => onPageChange(n)}
            className={`px-2.5 py-1.5 text-xs font-600 rounded-lg border transition-colors min-w-[32px] ${
              n === page
                ? 'gradient-primary text-white border-transparent'
                : 'border-border hover:bg-muted/60 text-foreground'
            }`}
          >
            {n}
          </button>
        ))}

        {pageNumbers[pageNumbers.length - 1] < totalPages && (
          <>
            {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
              <span className="px-1 text-muted-foreground text-xs">…</span>
            )}
            <button
              onClick={() => onPageChange(totalPages)}
              className="px-2.5 py-1.5 text-xs font-600 rounded-lg border border-border hover:bg-muted/60 transition-colors"
            >
              {totalPages}
            </button>
          </>
        )}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages || totalPages === 0}
          className="px-2.5 py-1.5 text-xs font-600 rounded-lg border border-border hover:bg-muted/60 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Next page"
        >
          ›
        </button>
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={page === totalPages || totalPages === 0}
          className="px-2.5 py-1.5 text-xs font-600 rounded-lg border border-border hover:bg-muted/60 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Last page"
        >
          »
        </button>
      </div>
    </div>
  );
}
