import test from 'node:test';
import assert from 'node:assert/strict';
import 'dotenv/config';
import app from '../src/app.js';
import prisma from '../src/config/db.js';

let server;
let baseUrl;
let adminToken;
let salesToken;
let testCustomerId;
let testProductId;
let testEnquiryId;
let testQuotationId;
let testOrderId;
let testDispatchId;

test.before(async () => {
  // Start server on dynamic port
  server = app.listen(0);
  const port = server.address().port;
  baseUrl = `http://localhost:${port}/api`;
});

test.after(async () => {
  if (server) server.close();
  await prisma.$disconnect();
});

test('1. Health Check Endpoint', async () => {
  const res = await fetch(`${baseUrl}/health`);
  const data = await res.json();
  assert.equal(res.status, 200);
  assert.equal(data.status, 'ok');
});

test('2. Authentication Flow (Admin & Sales User)', async () => {
  // Login as Admin
  const adminRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@erp.com', password: 'admin123' }),
  });
  const adminData = await adminRes.json();
  assert.equal(adminRes.status, 200);
  assert.ok(adminData.token);
  assert.equal(adminData.user.role, 'ADMIN');
  adminToken = adminData.token;

  // Login as Sales User
  const salesRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'sales@erp.com', password: 'sales123' }),
  });
  const salesData = await salesRes.json();
  assert.equal(salesRes.status, 200);
  assert.ok(salesData.token);
  assert.equal(salesData.user.role, 'SALES_USER');
  salesToken = salesData.token;
});

test('3. Product Catalog & Inventory Setup', async () => {
  const code = `TEST-P-${Date.now().toString().slice(-4)}`;
  const res = await fetch(`${baseUrl}/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      productCode: code,
      productName: 'Heavy Duty Structural Steel Beam',
      category: 'Steel Works',
      unit: 'pieces',
      basePrice: 5000,
    }),
  });

  const product = await res.json();
  assert.equal(res.status, 201);
  assert.equal(product.productCode, code);
  testProductId = product.id;

  // Add stock to inventory
  const stockRes = await fetch(`${baseUrl}/inventory/stock`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      productId: testProductId,
      quantity: 50,
    }),
  });
  assert.equal(stockRes.status, 200);
  const inv = await stockRes.json();
  assert.equal(inv.physicalQuantity, 50);
});

test('4. Customer Management', async () => {
  const companyName = `Zenith Engineering Ltd ${Date.now().toString().slice(-4)}`;
  const res = await fetch(`${baseUrl}/customers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${salesToken}`,
    },
    body: JSON.stringify({
      companyName,
      contactPerson: 'Vikram Mehta',
      mobile: '9811223344',
      email: 'vikram@zenith.com',
      city: 'Pune',
    }),
  });

  const customer = await res.json();
  assert.equal(res.status, 201);
  assert.equal(customer.companyName, companyName);
  testCustomerId = customer.id;
});

test('5. Customer Enquiry Creation (Workflow Stage 1)', async () => {
  const res = await fetch(`${baseUrl}/enquiries`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${salesToken}`,
    },
    body: JSON.stringify({
      customerId: testCustomerId,
      enquiryDate: new Date().toISOString(),
      requiredDate: new Date(Date.now() + 86400000 * 7).toISOString(),
      items: [
        {
          productId: testProductId,
          quantity: 10,
          notes: 'Standard ISO specification required',
        },
      ],
    }),
  });

  const enquiry = await res.json();
  assert.equal(res.status, 201);
  assert.match(enquiry.enquiryNumber, /^ENQ-/);
  assert.equal(enquiry.status, 'NEW');
  assert.equal(enquiry.items.length, 1);
  testEnquiryId = enquiry.id;
});

test('6. Quotation Generation & Tax Calculation (Workflow Stage 2)', async () => {
  const res = await fetch(`${baseUrl}/quotations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${salesToken}`,
    },
    body: JSON.stringify({
      enquiryId: testEnquiryId,
      customerId: testCustomerId,
      validUntil: new Date(Date.now() + 86400000 * 15).toISOString(),
      items: [
        {
          productId: testProductId,
          quantity: 10,
          unitPrice: 5000,
          discountPercent: 10, // 10% discount => net 45,000
          gstPercent: 18, // 18% GST => 8,100 => Total 53,100
        },
      ],
    }),
  });

  const quotation = await res.json();
  assert.equal(res.status, 201);
  assert.match(quotation.quotationNumber, /^QT-/);
  assert.equal(quotation.status, 'DRAFT');
  assert.equal(Number(quotation.totalAmount), 45000);
  assert.equal(Number(quotation.gstAmount), 8100);
  testQuotationId = quotation.id;

  // Accept Quotation
  const acceptRes = await fetch(`${baseUrl}/quotations/${testQuotationId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${salesToken}`,
    },
    body: JSON.stringify({ status: 'ACCEPTED' }),
  });
  const acceptedQuote = await acceptRes.json();
  assert.equal(acceptRes.status, 200);
  assert.equal(acceptedQuote.status, 'ACCEPTED');

  // Verify linked Enquiry status transitioned to WON
  const enqRes = await fetch(`${baseUrl}/enquiries/${testEnquiryId}`, {
    headers: { Authorization: `Bearer ${salesToken}` },
  });
  const updatedEnq = await enqRes.json();
  assert.equal(updatedEnq.status, 'WON');
});

test('7. Sales Order Creation from Quotation (Workflow Stage 3)', async () => {
  const res = await fetch(`${baseUrl}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${salesToken}`,
    },
    body: JSON.stringify({ quotationId: testQuotationId }),
  });

  const order = await res.json();
  assert.equal(res.status, 201);
  assert.match(order.orderNumber, /^SO-/);
  assert.equal(order.status, 'PENDING');
  assert.equal(Number(order.totalAmount), 45000);
  testOrderId = order.id;

  // Prevent duplicate order creation for same quotation
  const dupRes = await fetch(`${baseUrl}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${salesToken}`,
    },
    body: JSON.stringify({ quotationId: testQuotationId }),
  });
  assert.equal(dupRes.status, 409);
});

test('8. RBAC Order Confirmation & Inventory Reservation (Workflow Stage 4)', async () => {
  // Sales User cannot confirm order (RBAC test)
  const forbiddenRes = await fetch(`${baseUrl}/orders/${testOrderId}/confirm`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${salesToken}` },
  });
  assert.equal(forbiddenRes.status, 403);

  // Admin confirms order
  const confirmRes = await fetch(`${baseUrl}/orders/${testOrderId}/confirm`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const confirmedOrder = await confirmRes.json();
  assert.equal(confirmRes.status, 200);
  assert.equal(confirmedOrder.status, 'CONFIRMED');

  // Verify inventory reservedQuantity incremented by 10
  const invRes = await fetch(`${baseUrl}/inventory/${testProductId}`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const inv = await invRes.json();
  assert.equal(inv.physicalQuantity, 50);
  assert.equal(inv.reservedQuantity, 10);
});

test('9. Outbound Dispatch & Inventory Deduction (Workflow Stage 5)', async () => {
  // Sales user cannot dispatch
  const forbiddenRes = await fetch(`${baseUrl}/dispatches`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${salesToken}`,
    },
    body: JSON.stringify({
      salesOrderId: testOrderId,
      items: [{ productId: testProductId, quantityDispatched: 10 }],
    }),
  });
  assert.equal(forbiddenRes.status, 403);

  // Admin executes dispatch
  const res = await fetch(`${baseUrl}/dispatches`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      salesOrderId: testOrderId,
      dispatchDate: new Date().toISOString(),
      vehicleNumber: 'MH-12-DE-9988',
      driverName: 'Suresh Patil',
      items: [{ productId: testProductId, quantityDispatched: 10 }],
    }),
  });

  const dispatch = await res.json();
  assert.equal(res.status, 201);
  assert.match(dispatch.dispatchNumber, /^DSP-/);
  testDispatchId = dispatch.id;

  // Verify physicalQuantity: 50 - 10 = 40, reservedQuantity: 10 - 10 = 0
  const invRes = await fetch(`${baseUrl}/inventory/${testProductId}`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const inv = await invRes.json();
  assert.equal(inv.physicalQuantity, 40);
  assert.equal(inv.reservedQuantity, 0);

  // Verify sales order transitioned to DISPATCHED
  const ordRes = await fetch(`${baseUrl}/orders/${testOrderId}`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const ord = await ordRes.json();
  assert.equal(ord.status, 'DISPATCHED');

  // Verify inventory audit log includes DISPATCH
  const auditRes = await fetch(`${baseUrl}/inventory/audit?productId=${testProductId}`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const auditData = await auditRes.json();
  assert.ok(auditData.items.some((l) => l.action === 'DISPATCH' && l.quantityChanged === -10));
});

test('10. Order Cancellation Releases Reserved Inventory', async () => {
  // Create another enquiry, quote, and confirmed order
  const enqRes = await fetch(`${baseUrl}/enquiries`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${salesToken}`,
    },
    body: JSON.stringify({
      customerId: testCustomerId,
      items: [{ productId: testProductId, quantity: 5 }],
    }),
  });
  const enq = await enqRes.json();

  const quoteRes = await fetch(`${baseUrl}/quotations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${salesToken}`,
    },
    body: JSON.stringify({
      enquiryId: enq.id,
      customerId: testCustomerId,
      items: [{ productId: testProductId, quantity: 5, unitPrice: 5000 }],
    }),
  });
  const quote = await quoteRes.json();

  await fetch(`${baseUrl}/quotations/${quote.id}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${salesToken}`,
    },
    body: JSON.stringify({ status: 'ACCEPTED' }),
  });

  const ordRes = await fetch(`${baseUrl}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${salesToken}`,
    },
    body: JSON.stringify({ quotationId: quote.id }),
  });
  const ord = await ordRes.json();

  // Confirm order to reserve 5 items
  await fetch(`${baseUrl}/orders/${ord.id}/confirm`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${adminToken}` },
  });

  let invRes = await fetch(`${baseUrl}/inventory/${testProductId}`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  let inv = await invRes.json();
  assert.equal(inv.reservedQuantity, 5);

  // Now cancel the order
  const cancelRes = await fetch(`${baseUrl}/orders/${ord.id}/cancel`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const cancelledOrder = await cancelRes.json();
  assert.equal(cancelRes.status, 200);
  assert.equal(cancelledOrder.status, 'CANCELLED');

  // Verify reserved quantity released back to 0
  invRes = await fetch(`${baseUrl}/inventory/${testProductId}`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  inv = await invRes.json();
  assert.equal(inv.reservedQuantity, 0);
});
