import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import { BusinessType, KPICard } from '@/types';

function ensureFirebaseConfigured() {
  if (!isFirebaseConfigured) {
    throw new Error(
      'Firebase environment variables are missing. Please configure NEXT_PUBLIC_FIREBASE_* values.'
    );
  }
}

function getFirestoreDb() {
  ensureFirebaseConfigured();
  return db!;
}

function parseNumber(value: unknown) {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number(String(value).replace(/[^0-9.-]/g, ''));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function safeField<T extends object>(item: T, field: string) {
  return (item as any)[field];
}

async function loadCollectionDocs(businessId: string, collectionName: string, pageSize?: number) {
  const firestore = getFirestoreDb();
  const collectionRef = collection(firestore, 'businesses', businessId, collectionName);
  const collectionQuery = pageSize
    ? query(
        collectionRef,
        orderBy('createdAt', 'desc'),
        orderBy('__name__', 'desc'),
        limit(pageSize)
      )
    : query(collectionRef, orderBy('createdAt', 'desc'), orderBy('__name__', 'desc'));

  const docs = await getDocs(collectionQuery);
  return docs.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

function formatCurrency(value: number) {
  return `₹${value.toLocaleString('en-IN')}`;
}

function buildKpiCard(id: string, label: string, value: number | string) {
  return {
    id,
    label,
    value: typeof value === 'number' ? value : value || 0,
    change: 0,
    changeType: 'neutral' as const,
    icon: 'IndianRupee',
    color: '#10B981',
  };
}

export interface DashboardStats {
  kpis: KPICard[];
  revenueTrend: Array<{ month: string; revenue: number }>;
}

export async function getDashboardStats(
  businessId: string,
  businessType: BusinessType
): Promise<DashboardStats> {
  const now = new Date();
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const sumRevenueFrom = (...sourceArrays: Array<Array<Record<string, unknown>>>) =>
    sourceArrays.reduce((sum, docs) => {
      return (
        sum +
        docs.reduce((inner, doc) => {
          const amount = parseNumber(
            safeField(doc, 'amount') ?? safeField(doc, 'total') ?? safeField(doc, 'price')
          );
          return inner + amount;
        }, 0)
      );
    }, 0);

  const isSameDay = (value: unknown, reference: Date) => {
    const parsed = new Date(String(value));
    return !Number.isNaN(parsed.getTime()) && parsed.toDateString() === reference.toDateString();
  };

  const countByStatus = (
    docs: Array<Record<string, unknown>>,
    statusField = 'status',
    statusValue: string
  ) =>
    docs.filter(
      (item) =>
        String(safeField(item, statusField) ?? '').toLowerCase() === statusValue.toLowerCase()
    ).length;

  const getNumberFieldSum = (docs: Array<Record<string, unknown>>, field: string) =>
    docs.reduce((sum, doc) => sum + parseNumber(safeField(doc, field)), 0);

  const getExpiringThisWeek = (members: Array<Record<string, unknown>>) =>
    members.filter((member) => {
      const expiry = new Date(
        String(safeField(member, 'expiryDate') ?? safeField(member, 'renewalDate') ?? '')
      );
      return !Number.isNaN(expiry.getTime()) && expiry >= now && expiry <= nextWeek;
    }).length;

  const getTodayCount = (docs: Array<Record<string, unknown>>, dateFields: string[]) =>
    docs.filter((doc) => dateFields.some((field) => isSameDay(safeField(doc, field), now))).length;

  let members: Array<Record<string, unknown>> = [];
  let classesData: Array<Record<string, unknown>> = [];
  let payments: Array<Record<string, unknown>> = [];
  let students: Array<Record<string, unknown>> = [];
  let courses: Array<Record<string, unknown>> = [];
  let fees: Array<Record<string, unknown>> = [];
  let bookings: Array<Record<string, unknown>> = [];
  let orders: Array<Record<string, unknown>> = [];
  let appointments: Array<Record<string, unknown>> = [];
  let tickets: Array<Record<string, unknown>> = [];
  let technicians: Array<Record<string, unknown>> = [];
  let rooms: Array<Record<string, unknown>> = [];
  let tables: Array<Record<string, unknown>> = [];
  let patients: Array<Record<string, unknown>> = [];

  switch (businessType) {
    case 'academy': {
      [students, courses, fees, payments] = await Promise.all([
        loadCollectionDocs(businessId, 'students'),
        loadCollectionDocs(businessId, 'courses'),
        loadCollectionDocs(businessId, 'fees'),
        loadCollectionDocs(businessId, 'payments'),
      ]);
      break;
    }
    case 'gym': {
      [members, classesData, payments, bookings] = await Promise.all([
        loadCollectionDocs(businessId, 'members'),
        loadCollectionDocs(businessId, 'classes'),
        loadCollectionDocs(businessId, 'payments'),
        loadCollectionDocs(businessId, 'bookings'),
      ]);
      break;
    }
    case 'hotel': {
      [rooms, bookings, payments] = await Promise.all([
        loadCollectionDocs(businessId, 'rooms'),
        loadCollectionDocs(businessId, 'bookings'),
        loadCollectionDocs(businessId, 'payments'),
      ]);
      break;
    }
    case 'restaurant': {
      [orders, payments, tables] = await Promise.all([
        loadCollectionDocs(businessId, 'orders'),
        loadCollectionDocs(businessId, 'payments'),
        loadCollectionDocs(businessId, 'tables'),
      ]);
      break;
    }
    case 'clinic': {
      [appointments, payments, patients] = await Promise.all([
        loadCollectionDocs(businessId, 'appointments'),
        loadCollectionDocs(businessId, 'payments'),
        loadCollectionDocs(businessId, 'patients'),
      ]);
      break;
    }
    case 'service-center': {
      [tickets, technicians, payments] = await Promise.all([
        loadCollectionDocs(businessId, 'tickets'),
        loadCollectionDocs(businessId, 'technicians'),
        loadCollectionDocs(businessId, 'payments'),
      ]);
      break;
    }
    case 'salon':
    case 'custom': {
      [payments, fees, bookings, orders, appointments, tickets] = await Promise.all([
        loadCollectionDocs(businessId, 'payments'),
        loadCollectionDocs(businessId, 'fees'),
        loadCollectionDocs(businessId, 'bookings'),
        loadCollectionDocs(businessId, 'orders'),
        loadCollectionDocs(businessId, 'appointments'),
        loadCollectionDocs(businessId, 'tickets'),
      ]);
      break;
    }
    default: {
      [payments, fees, bookings, orders, appointments, tickets] = await Promise.all([
        loadCollectionDocs(businessId, 'payments'),
        loadCollectionDocs(businessId, 'fees'),
        loadCollectionDocs(businessId, 'bookings'),
        loadCollectionDocs(businessId, 'orders'),
        loadCollectionDocs(businessId, 'appointments'),
        loadCollectionDocs(businessId, 'tickets'),
      ]);
      break;
    }
  }

  const totalRevenue = sumRevenueFrom(payments, fees, bookings, orders, appointments, tickets);

  const commonKpis: Record<BusinessType, KPICard[]> = {
    academy: [
      buildKpiCard('kpi-academy-1', 'Total Students', students.length),
      buildKpiCard('kpi-academy-2', 'Active Courses', courses.length),
      {
        ...buildKpiCard(
          'kpi-academy-3',
          'Fees Collected',
          formatCurrency(sumRevenueFrom(fees, payments))
        ),
        icon: 'IndianRupee',
        color: '#10B981',
      },
      {
        ...buildKpiCard(
          'kpi-academy-4',
          'Pending Fees',
          formatCurrency(getNumberFieldSum(students, 'pendingFees'))
        ),
        icon: 'AlertCircle',
        color: '#EF4444',
      },
    ],
    gym: [
      buildKpiCard('kpi-gym-1', 'Active Members', members.length),
      buildKpiCard('kpi-gym-2', 'Classes Today', getTodayCount(classesData, ['classDate', 'date'])),
      {
        ...buildKpiCard(
          'kpi-gym-3',
          'Monthly Revenue',
          formatCurrency(sumRevenueFrom(payments, bookings))
        ),
        icon: 'IndianRupee',
        color: '#10B981',
      },
      buildKpiCard('kpi-gym-4', 'Expiring This Week', getExpiringThisWeek(members)),
    ],
    hotel: [
      buildKpiCard('kpi-hotel-1', 'Total Rooms', rooms.length),
      buildKpiCard(
        'kpi-hotel-2',
        'Available Rooms',
        rooms.filter(
          (room) => String(safeField(room, 'status') ?? '').toLowerCase() === 'available'
        ).length
      ),
      buildKpiCard(
        'kpi-hotel-3',
        'Occupied Rooms',
        rooms.filter((room) => String(safeField(room, 'status') ?? '').toLowerCase() === 'occupied')
          .length
      ),
      {
        ...buildKpiCard(
          'kpi-hotel-4',
          "Today's Revenue",
          formatCurrency(sumRevenueFrom(bookings, payments))
        ),
        icon: 'IndianRupee',
        color: '#10B981',
      },
    ],
    restaurant: [
      buildKpiCard(
        'kpi-rest-1',
        "Today's Orders",
        getTodayCount(orders, ['orderDate', 'createdAt', 'date'])
      ),
      buildKpiCard(
        'kpi-rest-2',
        'Active Tables',
        tables.filter(
          (table) => String(safeField(table, 'status') ?? '').toLowerCase() === 'active'
        ).length
      ),
      {
        ...buildKpiCard(
          'kpi-rest-3',
          'Total Revenue',
          formatCurrency(sumRevenueFrom(orders, payments))
        ),
        icon: 'IndianRupee',
        color: '#10B981',
      },
      buildKpiCard('kpi-rest-4', 'Pending Orders', countByStatus(orders, 'status', 'pending')),
    ],
    clinic: [
      buildKpiCard(
        'kpi-clinic-1',
        "Today's Appointments",
        getTodayCount(appointments, ['appointmentDate', 'createdAt', 'date'])
      ),
      buildKpiCard('kpi-clinic-2', 'Total Patients', patients.length),
      {
        ...buildKpiCard(
          'kpi-clinic-3',
          'Total Revenue',
          formatCurrency(sumRevenueFrom(appointments, payments))
        ),
        icon: 'IndianRupee',
        color: '#10B981',
      },
      buildKpiCard(
        'kpi-clinic-4',
        'Pending Follow-ups',
        countByStatus(appointments, 'followUpStatus', 'pending') ||
          countByStatus(appointments, 'status', 'pending')
      ),
    ],
    'service-center': [
      buildKpiCard('kpi-svc-1', 'Open Tickets', countByStatus(tickets, 'status', 'open')),
      buildKpiCard('kpi-svc-2', 'Assigned Technicians', technicians.length),
      buildKpiCard(
        'kpi-svc-3',
        'Completed Services',
        countByStatus(tickets, 'status', 'completed')
      ),
      {
        ...buildKpiCard(
          'kpi-svc-4',
          'Total Revenue',
          formatCurrency(sumRevenueFrom(tickets, payments))
        ),
        icon: 'IndianRupee',
        color: '#10B981',
      },
    ],
    salon: [
      buildKpiCard('kpi-salon-1', 'Total Records', 0),
      buildKpiCard('kpi-salon-2', 'Active Records', 0),
      {
        ...buildKpiCard('kpi-salon-3', 'Total Revenue', formatCurrency(totalRevenue)),
        icon: 'IndianRupee',
        color: '#10B981',
      },
      buildKpiCard('kpi-salon-4', 'Outstanding Items', 0),
    ],
    custom: [
      buildKpiCard('kpi-custom-1', 'Total Records', 0),
      buildKpiCard('kpi-custom-2', 'Active Records', 0),
      {
        ...buildKpiCard('kpi-custom-3', 'Total Revenue', formatCurrency(totalRevenue)),
        icon: 'IndianRupee',
        color: '#10B981',
      },
      buildKpiCard('kpi-custom-4', 'Outstanding Items', 0),
    ],
  };

  const stats: Record<BusinessType, KPICard[]> = {
    academy: commonKpis.academy,
    gym: commonKpis.gym,
    hotel: commonKpis.hotel,
    restaurant: commonKpis.restaurant,
    clinic: commonKpis.clinic,
    'service-center': commonKpis['service-center'],
    salon: commonKpis.custom,
    custom: commonKpis.custom,
  };

  const recentRevenue =
    payments.length > 0
      ? payments
      : bookings.length > 0
        ? bookings
        : fees.length > 0
          ? fees
          : orders;
  const revenueByMonth = new Map<string, number>();
  recentRevenue.forEach((doc) => {
    const dateValue =
      safeField(doc, 'paymentDate') ??
      safeField(doc, 'createdAt') ??
      safeField(doc, 'bookingDate') ??
      safeField(doc, 'orderDate');
    const date = new Date(String(dateValue));
    if (Number.isNaN(date.getTime())) return;
    const month = date.toLocaleDateString('en-IN', { month: 'short' });
    revenueByMonth.set(
      month,
      (revenueByMonth.get(month) ?? 0) +
        parseNumber(safeField(doc, 'amount') ?? safeField(doc, 'total') ?? safeField(doc, 'price'))
    );
  });

  const revenueTrendData = Array.from(revenueByMonth.entries())
    .slice(-6)
    .map(([month, revenue]) => ({ month, revenue }));

  return {
    kpis: stats[businessType] ?? stats.custom,
    revenueTrend: revenueTrendData,
  };
}
