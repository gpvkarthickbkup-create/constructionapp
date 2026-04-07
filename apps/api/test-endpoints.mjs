// Comprehensive API endpoint test script
const BASE = 'http://localhost:4000';
let PASS = 0, FAIL = 0;
let TOKEN = '';
let SITE_ID = '', VENDOR_ID = '', CUSTOMER_ID = '', EXPENSE_ID = '';

async function req(method, path, body, isFormData) {
  const headers = {};
  if (TOKEN) headers['Authorization'] = `Bearer ${TOKEN}`;
  if (body && !isFormData) headers['Content-Type'] = 'application/json';

  const opts = { method, headers };
  if (body && !isFormData) opts.body = JSON.stringify(body);
  if (isFormData) opts.body = body;

  try {
    const res = await fetch(`${BASE}${path}`, opts);
    const text = await res.text();
    let json;
    try { json = JSON.parse(text); } catch { json = text; }
    return { status: res.status, body: json, ok: res.ok };
  } catch (e) {
    return { status: 0, body: e.message, ok: false };
  }
}

function report(num, endpoint, result) {
  const verdict = result.ok ? 'PASS' : 'FAIL';
  if (result.ok) PASS++; else FAIL++;
  const bodyStr = typeof result.body === 'string' ? result.body : JSON.stringify(result.body);
  console.log(`[${verdict}] #${num} ${endpoint} => HTTP ${result.status}`);
  console.log(`  Body: ${bodyStr.substring(0, 200)}`);
  console.log('');
  return result;
}

async function run() {
  console.log('=========================================');
  console.log('  DATALYTICS CONSTRUCTION API TESTS');
  console.log('=========================================\n');

  // 1. Health
  report(1, 'GET /api/health', await req('GET', '/api/health'));

  // 2. Login
  const login = report(2, 'POST /api/auth/login', await req('POST', '/api/auth/login', {
    email: 'Gpvk@datalytics.com', password: 'Datalytics@123'
  }));
  if (!login.ok) { console.log('FATAL: Login failed. Aborting.'); process.exit(1); }
  TOKEN = login.body?.data?.accessToken || login.body?.accessToken || '';
  if (!TOKEN) { console.log('FATAL: No token. Body:', JSON.stringify(login.body)); process.exit(1); }
  console.log(`  Token acquired: ${TOKEN.substring(0, 20)}...\n`);

  // 3. GET /api/auth/me
  report(3, 'GET /api/auth/me', await req('GET', '/api/auth/me'));

  // 4. GET /api/dashboard
  report(4, 'GET /api/dashboard', await req('GET', '/api/dashboard'));

  // 5. GET /api/sites
  report(5, 'GET /api/sites', await req('GET', '/api/sites'));

  // 6. POST /api/sites
  const siteRes = report(6, 'POST /api/sites', await req('POST', '/api/sites', {
    siteName: 'API Test Site', projectType: 'house', estimatedBudget: 500000, status: 'planning'
  }));
  SITE_ID = siteRes.body?.data?.id || '';
  console.log(`  Created Site ID: ${SITE_ID}\n`);

  // 7. GET /api/sites/:id
  report(7, 'GET /api/sites/:id', await req('GET', `/api/sites/${SITE_ID}`));

  // 8. GET /api/sites/:id/dashboard
  report(8, 'GET /api/sites/:id/dashboard', await req('GET', `/api/sites/${SITE_ID}/dashboard`));

  // 9. PUT /api/sites/:id
  report(9, 'PUT /api/sites/:id', await req('PUT', `/api/sites/${SITE_ID}`, {
    siteName: 'API Test Site Updated', status: 'active'
  }));

  // 10. GET /api/expenses
  report(10, 'GET /api/expenses', await req('GET', '/api/expenses'));

  // 11. POST /api/expenses
  const expRes = report(11, 'POST /api/expenses', await req('POST', '/api/expenses', {
    siteId: SITE_ID, expenseDate: '2026-04-05', expenseType: 'material',
    itemName: 'Test Cement', quantity: 10, rate: 350, totalAmount: 3500,
    paymentStatus: 'unpaid', paidAmount: 0
  }));
  EXPENSE_ID = expRes.body?.data?.id || '';
  console.log(`  Created Expense ID: ${EXPENSE_ID}\n`);

  // 12. GET /api/expenses/recent-items
  report(12, 'GET /api/expenses/recent-items', await req('GET', '/api/expenses/recent-items'));

  // 13. GET /api/vendors
  report(13, 'GET /api/vendors', await req('GET', '/api/vendors'));

  // 14. POST /api/vendors
  const vendorRes = report(14, 'POST /api/vendors', await req('POST', '/api/vendors', {
    name: 'Test Vendor Corp', type: 'supplier', mobile: '9876543210'
  }));
  VENDOR_ID = vendorRes.body?.data?.id || '';
  console.log(`  Created Vendor ID: ${VENDOR_ID}\n`);

  // 15. GET /api/vendors/:id/detail
  report(15, 'GET /api/vendors/:id/detail', await req('GET', `/api/vendors/${VENDOR_ID}/detail`));

  // 16. GET /api/customers
  report(16, 'GET /api/customers', await req('GET', '/api/customers'));

  // 17. POST /api/customers
  const custRes = report(17, 'POST /api/customers', await req('POST', '/api/customers', {
    name: 'Test Client', mobile: '9876543211', email: 'testclient@example.com'
  }));
  CUSTOMER_ID = custRes.body?.data?.id || '';
  console.log(`  Created Customer ID: ${CUSTOMER_ID}\n`);

  // 18. GET /api/customers/:id
  report(18, 'GET /api/customers/:id', await req('GET', `/api/customers/${CUSTOMER_ID}`));

  // 19. POST /api/customers/:id/collections
  report(19, 'POST /api/customers/:id/collections', await req('POST', `/api/customers/${CUSTOMER_ID}/collections`, {
    amount: 50000, collectionDate: '2026-04-05', paymentType: 'cash', siteId: SITE_ID, notes: 'Test payment'
  }));

  // 20. GET /api/users
  report(20, 'GET /api/users', await req('GET', '/api/users'));

  // 21. GET /api/users/roles
  report(21, 'GET /api/users/roles', await req('GET', '/api/users/roles'));

  // 22. GET /api/users/categories
  report(22, 'GET /api/users/categories', await req('GET', '/api/users/categories'));

  // 23. GET /api/users/company
  report(23, 'GET /api/users/company', await req('GET', '/api/users/company'));

  // 24. PUT /api/users/company
  report(24, 'PUT /api/users/company', await req('PUT', '/api/users/company', { currency: 'INR' }));

  // 25. POST /api/users/categories
  report(25, 'POST /api/users/categories', await req('POST', '/api/users/categories', {
    name: 'Test Category', type: 'material', color: '#FF5733', icon: 'hammer'
  }));

  // 26-32. Reports
  const reports = ['site-wise', 'category-wise', 'vendor-wise', 'pending-payments', 'budget-vs-actual', 'monthly-spending', 'date-wise'];
  for (let i = 0; i < reports.length; i++) {
    report(26 + i, `GET /api/reports/${reports[i]}`, await req('GET', `/api/reports/${reports[i]}`));
  }

  // 33. POST /api/upload/single (multipart form)
  const { Blob, FormData } = globalThis;
  const formData = new FormData();
  formData.append('file', new Blob(['test file content'], { type: 'text/plain' }), 'test_upload.txt');
  report(33, 'POST /api/upload/single', await req('POST', '/api/upload/single', formData, true));

  console.log('=========================================');
  console.log('  SUMMARY');
  console.log('=========================================');
  console.log(`  PASSED: ${PASS}`);
  console.log(`  FAILED: ${FAIL}`);
  console.log(`  TOTAL:  ${PASS + FAIL}`);
  console.log('=========================================');
}

run().catch(e => { console.error('Script error:', e); process.exit(1); });
