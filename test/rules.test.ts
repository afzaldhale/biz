/**
 * Firestore Security Rules Unit Tests
 * 
 * Tests the proposed Firestore rules for users, businesses, and subcollections.
 * Runs against Firebase Emulator Suite (Firestore + Auth).
 * 
 * Usage:
 *   npm run test:rules
 * 
 * Prerequisites:
 *   - Firebase Emulator running: firebase emulators:start --only firestore,auth
 *   - npm dependencies installed
 */

import {
  initializeTestEnvironment,
  RulesTestEnvironment,
  RulesTestContext,
} from '@firebase/rules-unit-testing';
import * as fs from 'fs';
import * as path from 'path';

let testEnv: RulesTestEnvironment;

// Test user credentials (role, email, businessId)
interface TestUser {
  uid: string;
  email: string;
  role: 'owner' | 'admin' | 'manager' | 'member';
  businessId: string | null;
  emailVerified: boolean;
}

const testUsers: Record<string, TestUser> = {
  owner1: {
    uid: 'owner1',
    email: 'owner1@test.com',
    role: 'owner',
    businessId: 'B1',
    emailVerified: true,
  },
  admin1: {
    uid: 'admin1',
    email: 'admin1@test.com',
    role: 'admin',
    businessId: 'B1',
    emailVerified: true,
  },
  manager1: {
    uid: 'manager1',
    email: 'manager1@test.com',
    role: 'manager',
    businessId: 'B1',
    emailVerified: true,
  },
  member1: {
    uid: 'member1',
    email: 'member1@test.com',
    role: 'member',
    businessId: 'B1',
    emailVerified: true,
  },
  outsider1: {
    uid: 'outsider1',
    email: 'outsider1@test.com',
    role: 'member',
    businessId: 'B2', // different business
    emailVerified: true,
  },
};

// Helper to get authenticated context for a test user
function getAuthedContext(userId: string): RulesTestContext {
  const user = testUsers[userId];
  if (!user) {
    throw new Error(`Unknown test user: ${userId}`);
  }
  return testEnv.authenticatedContext(userId, {
    email: user.email,
    email_verified: user.emailVerified,
  });
}

// Helper to get unauthenticated context
function getUnauthedContext(): RulesTestContext {
  return testEnv.unauthenticatedContext();
}

// ============================================================
// SETUP & TEARDOWN
// ============================================================

beforeAll(async () => {
  // Load the proposed Firestore rules
  const rulesPath = path.join(__dirname, '..', 'firestore.staging.rules');
  let rulesContent: string;

  // If staging rules not present, fallback to firestore.rules (production)
  if (fs.existsSync(rulesPath)) {
    rulesContent = fs.readFileSync(rulesPath, 'utf8');
  } else {
    const prodRulesPath = path.join(__dirname, '..', 'firestore.rules');
    if (fs.existsSync(prodRulesPath)) {
      rulesContent = fs.readFileSync(prodRulesPath, 'utf8');
    } else {
      throw new Error(
        'No firestore.rules or firestore.staging.rules found. ' +
        'Please create firestore.staging.rules in the project root.'
      );
    }
  }

  // Initialize test environment with emulator
  testEnv = await initializeTestEnvironment({
    projectId: 'bizmanage-staging',
    firestore: {
      host: 'localhost',
      port: 8080,
      rules: rulesContent,
    },
  });

  // Seed test data: users and businesses
  await seedTestData();
});

afterAll(async () => {
  await testEnv.cleanup();
});

// Seed initial test data
async function seedTestData(): Promise<void> {
  const adminDb = testEnv.authenticatedContext('admin-seed', {
    email_verified: true,
  }).firestore();

  // Create test user documents
  for (const [key, user] of Object.entries(testUsers)) {
    await adminDb.collection('users').doc(user.uid).set({
      uid: user.uid,
      email: user.email,
      ownerName: `Test User ${key}`,
      phone: '5551234567',
      role: user.role,
      businessId: user.businessId,
      emailVerified: user.emailVerified,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  // Create test businesses
  await adminDb.collection('businesses').doc('B1').set({
    businessId: 'B1',
    ownerId: 'owner1',
    ownerName: 'Test Owner',
    businessName: 'Test Business 1',
    businessType: 'academy',
    selectedPlan: 'custom',
    planLimit: 100,
    currentUsage: 0,
    email: 'owner1@test.com',
    phone: '5551234567',
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  await adminDb.collection('businesses').doc('B2').set({
    businessId: 'B2',
    ownerId: 'outsider1',
    ownerName: 'Outsider',
    businessName: 'Test Business 2',
    businessType: 'gym',
    selectedPlan: 'custom',
    planLimit: 50,
    currentUsage: 0,
    email: 'outsider1@test.com',
    phone: '5559876543',
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // Create sample students in B1
  await adminDb.collection('businesses').doc('B1').collection('students').doc('student1').set({
    id: 'student1',
    name: 'John Student',
    email: 'student1@test.com',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // Create sample gym members in B1
  await adminDb.collection('businesses').doc('B1').collection('gymMembers').doc('member1').set({
    id: 'member1',
    name: 'Jane Gym Member',
    email: 'member1@test.com',
    phone: '5551112222',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // Create sample payment in B1
  await adminDb
    .collection('businesses')
    .doc('B1')
    .collection('gymPayments')
    .doc('payment1')
    .set({
      id: 'payment1',
      memberDocId: 'member1',
      amount: 50.0,
      currency: 'USD',
      paymentMethod: 'credit_card',
      status: 'completed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

  // Create sample invoice in B1
  await adminDb.collection('businesses').doc('B1').collection('invoices').doc('invoice1').set({
    id: 'invoice1',
    totalAmount: 500.0,
    paidAmount: 0,
    status: 'pending',
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // Create sample settings in B1
  await adminDb.collection('businesses').doc('B1').collection('settings').doc('general').set({
    id: 'general',
    businessName: 'Test Business 1',
    timezone: 'UTC',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // Create sample dashboardStats in B1
  await adminDb.collection('businesses').doc('B1').collection('dashboardStats').doc('stats1').set({
    id: 'stats1',
    totalStudents: 50,
    totalMembers: 30,
    totalRevenue: 5000.0,
    generatedAt: new Date().toISOString(),
  });
}

// ============================================================
// TEST SUITES
// ============================================================

describe('Firestore Security Rules - Users Collection', () => {
  test('user can create own user profile on signup (owner role)', async () => {
    const unauthedDb = getUnauthedContext().firestore();
    const newUserId = 'newuser1';

    await testEnv.withSecurityRulesDisabled(async (adminDb) => {
      // Clear any existing newuser1 doc
      await adminDb.collection('users').doc(newUserId).delete();
    });

    // Simulate signup: unauthenticated context creating own user (not actually possible in real auth,
    // but this shows the rule logic). For this test, use an authenticated but new user context.
    const newUserDb = testEnv.authenticatedContext(newUserId, {
      email_verified: false,
    }).firestore();

    const createPromise = newUserDb.collection('users').doc(newUserId).set({
      uid: newUserId,
      email: 'newuser@test.com',
      ownerName: 'New User',
      phone: '5551234567',
      role: 'owner',
      emailVerified: false,
      createdAt: new Date().toISOString(),
    });

    await expect(createPromise).resolves.toBeDefined();
  });

  test('user cannot update own role or emailVerified field', async () => {
    const owner1Db = getAuthedContext('owner1').firestore();

    const updatePromise = owner1Db.collection('users').doc('owner1').update({
      role: 'admin', // attempting escalation
    });

    await expect(updatePromise).rejects.toThrow();
  });

  test('user cannot update another user\'s profile', async () => {
    const member1Db = getAuthedContext('member1').firestore();

    const updatePromise = member1Db.collection('users').doc('owner1').update({
      ownerName: 'Hacked Owner',
    });

    await expect(updatePromise).rejects.toThrow();
  });

  test('user can update own safe fields (ownerName, phone)', async () => {
    const owner1Db = getAuthedContext('owner1').firestore();

    const updatePromise = owner1Db.collection('users').doc('owner1').update({
      ownerName: 'Updated Owner Name',
    });

    await expect(updatePromise).resolves.toBeDefined();
  });

  test('user cannot delete own or other profiles', async () => {
    const member1Db = getAuthedContext('member1').firestore();

    const deletePromise = member1Db.collection('users').doc('member1').delete();

    await expect(deletePromise).rejects.toThrow();
  });
});

describe('Firestore Security Rules - Businesses Collection', () => {
  test('owner can create business with ownerId matching uid', async () => {
    const owner1Db = getAuthedContext('owner1').firestore();

    const createPromise = owner1Db.collection('businesses').doc('B3').set({
      businessId: 'B3',
      ownerId: 'owner1',
      ownerName: 'Owner Name',
      businessName: 'New Business',
      businessType: 'academy',
      selectedPlan: 'custom',
      planLimit: 100,
      currentUsage: 0,
      email: 'owner1@test.com',
      phone: '5551234567',
      status: 'active',
      createdAt: new Date().toISOString(),
    });

    await expect(createPromise).resolves.toBeDefined();
  });

  test('non-owner cannot create business with themselves as ownerId', async () => {
    const member1Db = getAuthedContext('member1').firestore();

    const createPromise = member1Db.collection('businesses').doc('B4').set({
      businessId: 'B4',
      ownerId: 'member1', // not allowed per rules (check create constraint)
      businessName: 'Hacked Business',
      businessType: 'gym',
      selectedPlan: 'custom',
      planLimit: 50,
      currentUsage: 0,
      email: 'member1@test.com',
      phone: '5551234567',
      status: 'active',
    });

    await expect(createPromise).rejects.toThrow();
  });

  test('member can read business B1', async () => {
    const member1Db = getAuthedContext('member1').firestore();

    const readPromise = member1Db.collection('businesses').doc('B1').get();

    await expect(readPromise).resolves.toBeDefined();
  });

  test('outsider cannot read business B1 (cross-business IDOR)', async () => {
    const outsider1Db = getAuthedContext('outsider1').firestore();

    const readPromise = outsider1Db.collection('businesses').doc('B1').get();

    // Rule should deny because outsider1.businessId != B1
    await expect(readPromise).rejects.toThrow();
  });

  test('owner can update business status (if rules allow)', async () => {
    const owner1Db = getAuthedContext('owner1').firestore();

    const updatePromise = owner1Db.collection('businesses').doc('B1').update({
      status: 'suspended',
    });

    // Expected: succeeds if owner, fails if rule restriction
    // Based on proposed rules: owner can update most fields
    await expect(updatePromise).resolves.toBeDefined();
  });

  test('manager cannot update business status', async () => {
    const manager1Db = getAuthedContext('manager1').firestore();

    const updatePromise = manager1Db.collection('businesses').doc('B1').update({
      status: 'suspended',
    });

    // Manager should not be able to change status
    await expect(updatePromise).rejects.toThrow();
  });

  test('cannot delete business', async () => {
    const owner1Db = getAuthedContext('owner1').firestore();

    const deletePromise = owner1Db.collection('businesses').doc('B1').delete();

    await expect(deletePromise).rejects.toThrow();
  });
});

describe('Firestore Security Rules - Students Subcollection', () => {
  test('owner can create student in B1', async () => {
    const owner1Db = getAuthedContext('owner1').firestore();

    const createPromise = owner1Db
      .collection('businesses')
      .doc('B1')
      .collection('students')
      .doc('student2')
      .set({
        name: 'New Student',
        email: 'newstudent@test.com',
        createdAt: new Date().toISOString(),
      });

    await expect(createPromise).resolves.toBeDefined();
  });

  test('admin can create student in B1', async () => {
    const admin1Db = getAuthedContext('admin1').firestore();

    const createPromise = admin1Db
      .collection('businesses')
      .doc('B1')
      .collection('students')
      .doc('student3')
      .set({
        name: 'Admin Created Student',
        email: 'adminstudent@test.com',
        createdAt: new Date().toISOString(),
      });

    await expect(createPromise).resolves.toBeDefined();
  });

  test('manager can create student in B1', async () => {
    const manager1Db = getAuthedContext('manager1').firestore();

    const createPromise = manager1Db
      .collection('businesses')
      .doc('B1')
      .collection('students')
      .doc('student4')
      .set({
        name: 'Manager Created Student',
        email: 'managerstudent@test.com',
        createdAt: new Date().toISOString(),
      });

    await expect(createPromise).resolves.toBeDefined();
  });

  test('member cannot create student in B1', async () => {
    const member1Db = getAuthedContext('member1').firestore();

    const createPromise = member1Db
      .collection('businesses')
      .doc('B1')
      .collection('students')
      .doc('student5')
      .set({
        name: 'Member Attempted Student',
        email: 'memberstudent@test.com',
        createdAt: new Date().toISOString(),
      });

    await expect(createPromise).rejects.toThrow();
  });

  test('member can read students in B1', async () => {
    const member1Db = getAuthedContext('member1').firestore();

    const readPromise = member1Db
      .collection('businesses')
      .doc('B1')
      .collection('students')
      .doc('student1')
      .get();

    await expect(readPromise).resolves.toBeDefined();
  });

  test('outsider cannot read students in B1', async () => {
    const outsider1Db = getAuthedContext('outsider1').firestore();

    const readPromise = outsider1Db
      .collection('businesses')
      .doc('B1')
      .collection('students')
      .doc('student1')
      .get();

    await expect(readPromise).rejects.toThrow();
  });

  test('owner can delete student from B1', async () => {
    const owner1Db = getAuthedContext('owner1').firestore();

    // Ensure student exists first
    await testEnv.withSecurityRulesDisabled(async (adminDb) => {
      await adminDb
        .collection('businesses')
        .doc('B1')
        .collection('students')
        .doc('student_to_delete')
        .set({ name: 'To Delete', email: 'delete@test.com' });
    });

    const deletePromise = owner1Db
      .collection('businesses')
      .doc('B1')
      .collection('students')
      .doc('student_to_delete')
      .delete();

    await expect(deletePromise).resolves.toBeDefined();
  });

  test('member cannot delete student from B1', async () => {
    const member1Db = getAuthedContext('member1').firestore();

    const deletePromise = member1Db
      .collection('businesses')
      .doc('B1')
      .collection('students')
      .doc('student1')
      .delete();

    await expect(deletePromise).rejects.toThrow();
  });
});

describe('Firestore Security Rules - GymMembers Subcollection', () => {
  test('manager can create gym member in B1', async () => {
    const manager1Db = getAuthedContext('manager1').firestore();

    const createPromise = manager1Db
      .collection('businesses')
      .doc('B1')
      .collection('gymMembers')
      .doc('gym_member2')
      .set({
        name: 'New Gym Member',
        email: 'newgym@test.com',
        phone: '5551234567',
        createdAt: new Date().toISOString(),
      });

    await expect(createPromise).resolves.toBeDefined();
  });

  test('member cannot create gym member in B1', async () => {
    const member1Db = getAuthedContext('member1').firestore();

    const createPromise = member1Db
      .collection('businesses')
      .doc('B1')
      .collection('gymMembers')
      .doc('gym_member3')
      .set({
        name: 'Attempted Gym Member',
        email: 'attemptedgym@test.com',
        phone: '5551234567',
      });

    await expect(createPromise).rejects.toThrow();
  });

  test('member can read gym members in B1', async () => {
    const member1Db = getAuthedContext('member1').firestore();

    const readPromise = member1Db
      .collection('businesses')
      .doc('B1')
      .collection('gymMembers')
      .doc('member1')
      .get();

    await expect(readPromise).resolves.toBeDefined();
  });
});

describe('Firestore Security Rules - Payments Subcollection', () => {
  test('admin can create payment in B1', async () => {
    const admin1Db = getAuthedContext('admin1').firestore();

    const createPromise = admin1Db
      .collection('businesses')
      .doc('B1')
      .collection('gymPayments')
      .doc('payment2')
      .set({
        memberDocId: 'member1',
        amount: 75.5,
        currency: 'USD',
        status: 'completed',
        createdAt: new Date().toISOString(),
      });

    await expect(createPromise).resolves.toBeDefined();
  });

  test('manager cannot create payment in B1 (billing restricted)', async () => {
    const manager1Db = getAuthedContext('manager1').firestore();

    const createPromise = manager1Db
      .collection('businesses')
      .doc('B1')
      .collection('gymPayments')
      .doc('payment3')
      .set({
        memberDocId: 'member1',
        amount: 50.0,
        currency: 'USD',
        status: 'pending',
      });

    await expect(createPromise).rejects.toThrow();
  });

  test('payment with negative amount should fail validation', async () => {
    const admin1Db = getAuthedContext('admin1').firestore();

    const createPromise = admin1Db
      .collection('businesses')
      .doc('B1')
      .collection('gymPayments')
      .doc('payment_negative')
      .set({
        memberDocId: 'member1',
        amount: -50.0, // Invalid: negative amount
        currency: 'USD',
        status: 'completed',
      });

    await expect(createPromise).rejects.toThrow();
  });

  test('member can read payments in B1', async () => {
    const member1Db = getAuthedContext('member1').firestore();

    const readPromise = member1Db
      .collection('businesses')
      .doc('B1')
      .collection('gymPayments')
      .doc('payment1')
      .get();

    await expect(readPromise).resolves.toBeDefined();
  });
});

describe('Firestore Security Rules - Invoices Subcollection', () => {
  test('admin can create invoice in B1', async () => {
    const admin1Db = getAuthedContext('admin1').firestore();

    const createPromise = admin1Db
      .collection('businesses')
      .doc('B1')
      .collection('invoices')
      .doc('invoice2')
      .set({
        totalAmount: 1000.0,
        paidAmount: 0,
        status: 'pending',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
      });

    await expect(createPromise).resolves.toBeDefined();
  });

  test('manager cannot create invoice in B1 (billing restricted)', async () => {
    const manager1Db = getAuthedContext('manager1').firestore();

    const createPromise = manager1Db
      .collection('businesses')
      .doc('B1')
      .collection('invoices')
      .doc('invoice3')
      .set({
        totalAmount: 500.0,
        paidAmount: 0,
        status: 'pending',
      });

    await expect(createPromise).rejects.toThrow();
  });

  test('only owner can delete invoice from B1', async () => {
    const owner1Db = getAuthedContext('owner1').firestore();

    // Ensure invoice exists
    await testEnv.withSecurityRulesDisabled(async (adminDb) => {
      await adminDb
        .collection('businesses')
        .doc('B1')
        .collection('invoices')
        .doc('invoice_to_delete')
        .set({
          totalAmount: 100.0,
          paidAmount: 0,
          status: 'pending',
        });
    });

    const deletePromise = owner1Db
      .collection('businesses')
      .doc('B1')
      .collection('invoices')
      .doc('invoice_to_delete')
      .delete();

    await expect(deletePromise).resolves.toBeDefined();
  });

  test('admin cannot delete invoice from B1 (delete owner-only)', async () => {
    const admin1Db = getAuthedContext('admin1').firestore();

    const deletePromise = admin1Db
      .collection('businesses')
      .doc('B1')
      .collection('invoices')
      .doc('invoice1')
      .delete();

    await expect(deletePromise).rejects.toThrow();
  });
});

describe('Firestore Security Rules - Settings Subcollection', () => {
  test('admin can read settings in B1', async () => {
    const admin1Db = getAuthedContext('admin1').firestore();

    const readPromise = admin1Db
      .collection('businesses')
      .doc('B1')
      .collection('settings')
      .doc('general')
      .get();

    await expect(readPromise).resolves.toBeDefined();
  });

  test('manager cannot read settings in B1 (admin/owner only)', async () => {
    const manager1Db = getAuthedContext('manager1').firestore();

    const readPromise = manager1Db
      .collection('businesses')
      .doc('B1')
      .collection('settings')
      .doc('general')
      .get();

    await expect(readPromise).rejects.toThrow();
  });

  test('admin can update settings in B1', async () => {
    const admin1Db = getAuthedContext('admin1').firestore();

    const updatePromise = admin1Db
      .collection('businesses')
      .doc('B1')
      .collection('settings')
      .doc('general')
      .update({
        timezone: 'EST',
      });

    await expect(updatePromise).resolves.toBeDefined();
  });

  test('only owner can delete settings from B1', async () => {
    const owner1Db = getAuthedContext('owner1').firestore();

    // Ensure settings doc exists
    await testEnv.withSecurityRulesDisabled(async (adminDb) => {
      await adminDb
        .collection('businesses')
        .doc('B1')
        .collection('settings')
        .doc('settings_to_delete')
        .set({
          businessName: 'Test',
        });
    });

    const deletePromise = owner1Db
      .collection('businesses')
      .doc('B1')
      .collection('settings')
      .doc('settings_to_delete')
      .delete();

    await expect(deletePromise).resolves.toBeDefined();
  });

  test('admin cannot delete settings from B1', async () => {
    const admin1Db = getAuthedContext('admin1').firestore();

    const deletePromise = admin1Db
      .collection('businesses')
      .doc('B1')
      .collection('settings')
      .doc('general')
      .delete();

    await expect(deletePromise).rejects.toThrow();
  });
});

describe('Firestore Security Rules - DashboardStats Subcollection', () => {
  test('member can read dashboardStats in B1', async () => {
    const member1Db = getAuthedContext('member1').firestore();

    const readPromise = member1Db
      .collection('businesses')
      .doc('B1')
      .collection('dashboardStats')
      .doc('stats1')
      .get();

    await expect(readPromise).resolves.toBeDefined();
  });

  test('owner cannot create dashboardStats (server-only)', async () => {
    const owner1Db = getAuthedContext('owner1').firestore();

    const createPromise = owner1Db
      .collection('businesses')
      .doc('B1')
      .collection('dashboardStats')
      .doc('stats2')
      .set({
        totalStudents: 100,
        totalMembers: 50,
        totalRevenue: 10000.0,
      });

    await expect(createPromise).rejects.toThrow();
  });

  test('member cannot update dashboardStats', async () => {
    const member1Db = getAuthedContext('member1').firestore();

    const updatePromise = member1Db
      .collection('businesses')
      .doc('B1')
      .collection('dashboardStats')
      .doc('stats1')
      .update({
        totalStudents: 999,
      });

    await expect(updatePromise).rejects.toThrow();
  });

  test('owner cannot delete dashboardStats', async () => {
    const owner1Db = getAuthedContext('owner1').firestore();

    const deletePromise = owner1Db
      .collection('businesses')
      .doc('B1')
      .collection('dashboardStats')
      .doc('stats1')
      .delete();

    await expect(deletePromise).rejects.toThrow();
  });
});

describe('Firestore Security Rules - IDOR & Cross-Business Access', () => {
  test('member from B1 cannot read students in B2', async () => {
    const member1Db = getAuthedContext('member1').firestore();

    const readPromise = member1Db
      .collection('businesses')
      .doc('B2')
      .collection('students')
      .doc('student1')
      .get();

    await expect(readPromise).rejects.toThrow();
  });

  test('outsider from B2 cannot read payments in B1', async () => {
    const outsider1Db = getAuthedContext('outsider1').firestore();

    const readPromise = outsider1Db
      .collection('businesses')
      .doc('B1')
      .collection('gymPayments')
      .doc('payment1')
      .get();

    await expect(readPromise).rejects.toThrow();
  });

  test('outsider from B2 cannot create records in B1', async () => {
    const outsider1Db = getAuthedContext('outsider1').firestore();

    const createPromise = outsider1Db
      .collection('businesses')
      .doc('B1')
      .collection('students')
      .doc('hacked_student')
      .set({
        name: 'Hacked Student',
        email: 'hacked@test.com',
      });

    await expect(createPromise).rejects.toThrow();
  });
});

describe('Firestore Security Rules - Unknown Collections', () => {
  test('cannot read from unknown collection', async () => {
    const owner1Db = getAuthedContext('owner1').firestore();

    const readPromise = owner1Db.collection('unknownCollection').doc('doc1').get();

    await expect(readPromise).rejects.toThrow();
  });

  test('cannot write to unknown collection', async () => {
    const owner1Db = getAuthedContext('owner1').firestore();

    const writePromise = owner1Db.collection('unknownCollection').doc('doc1').set({
      data: 'test',
    });

    await expect(writePromise).rejects.toThrow();
  });
});
