import { Router } from 'express';
import {
  loginUser,
  registerUser,
} from '../controllers/authController.js';
import {
  list as listCustomers,
  getById as getCustomer,
  create as createCustomer,
  update as updateCustomer,
  remove as removeCustomer,
} from '../controllers/customerController.js';
import {
  list as listEnquiries,
  getById as getEnquiry,
  create as createEnquiry,
  updateStatus as updateEnquiryStatus,
} from '../controllers/enquiryController.js';
import {
  list as listQuotations,
  getById as getQuotation,
  create as createQuotation,
  updateStatus as updateQuotationStatus,
} from '../controllers/quotationController.js';
import {
  list as listOrders,
  getById as getOrder,
  createFromQuotation,
  confirm,
  cancel,
} from '../controllers/orderController.js';
import {
  list as listInventory,
  getByProductId,
  addStock,
  setPhysical,
  auditLog,
} from '../controllers/inventoryController.js';
import {
  list as listProducts,
  getById as getProduct,
  create as createProduct,
  update as updateProduct,
  remove as removeProduct,
} from '../controllers/productController.js';
import {
  list as listDispatches,
  getById as getDispatch,
  create as createDispatch,
} from '../controllers/dispatchController.js';
import { getStats } from '../controllers/dashboardController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  loginRules,
  registerRules,
  customerRules,
  productRules,
  enquiryRules,
  quotationRules,
  orderFromQuotationRules,
  dispatchRules,
  stockRules,
  setStockRules,
  idParam,
  productIdParam,
  listQuery,
} from '../utils/validators.js';

const router = Router();

// ─── Auth ───────────────────────────────────────────────────────────
router.post('/auth/register', registerRules, registerUser);
router.post('/auth/login', loginRules, loginUser);

// ─── Dashboard ──────────────────────────────────────────────────────
router.get('/dashboard/stats', authenticate, getStats);

// ─── Products ───────────────────────────────────────────────────────
router.use('/products', authenticate);
router.get('/products', listQuery, listProducts);
router.get('/products/:id', idParam, getProduct);
router.post('/products', productRules, createProduct);
router.put('/products/:id', idParam, productRules, updateProduct);
router.delete('/products/:id', idParam, removeProduct);

// ─── Inventory ──────────────────────────────────────────────────────
router.use('/inventory', authenticate);
router.get('/inventory', listQuery, listInventory);
router.get('/inventory/audit', listQuery, auditLog);
router.get('/inventory/:productId', productIdParam, getByProductId);
router.post('/inventory/stock', stockRules, addStock);
router.put('/inventory/:productId/physical', productIdParam, setStockRules, setPhysical);

// ─── Customers ──────────────────────────────────────────────────────
router.use('/customers', authenticate);
router.get('/customers', listQuery, listCustomers);
router.get('/customers/:id', idParam, getCustomer);
router.post('/customers', customerRules, createCustomer);
router.put('/customers/:id', idParam, customerRules, updateCustomer);
router.delete('/customers/:id', idParam, removeCustomer);

// ─── Enquiries ──────────────────────────────────────────────────────
router.use('/enquiries', authenticate);
router.get('/enquiries', listQuery, listEnquiries);
router.get('/enquiries/:id', idParam, getEnquiry);
router.post('/enquiries', enquiryRules, createEnquiry);
router.patch('/enquiries/:id/status', idParam, updateEnquiryStatus);

// ─── Quotations ─────────────────────────────────────────────────────
router.use('/quotations', authenticate);
router.get('/quotations', listQuery, listQuotations);
router.get('/quotations/:id', idParam, getQuotation);
router.post('/quotations', quotationRules, createQuotation);
router.patch('/quotations/:id/status', idParam, updateQuotationStatus);

// ─── Orders ─────────────────────────────────────────────────────────
router.use('/orders', authenticate);
router.get('/orders', listQuery, listOrders);
router.get('/orders/:id', idParam, getOrder);
router.post('/orders', orderFromQuotationRules, createFromQuotation);
router.patch('/orders/:id/confirm', idParam, authorize('ADMIN'), confirm);
router.patch('/orders/:id/cancel', idParam, cancel);

// ─── Dispatches ─────────────────────────────────────────────────────
router.use('/dispatches', authenticate);
router.get('/dispatches', listQuery, listDispatches);
router.get('/dispatches/:id', idParam, getDispatch);
router.post('/dispatches', dispatchRules, createDispatch);

export default router;
