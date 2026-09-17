import cors from 'cors';
import express from 'express';
import routes from './routes/index.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (_req, res) => {
  res.json({
    name: 'Apex Manufacturing & Supply ERP API',
    version: '1.0.0',
    status: 'online',
    workflow: 'Customer Enquiry → Quotation → Sales Order → Inventory Reservation → Dispatch',
    endpoints: {
      health: '/api/health',
      auth: {
        login: 'POST /api/auth/login',
        register: 'POST /api/auth/register',
      },
      dashboard: 'GET /api/dashboard/stats',
      customers: '/api/customers',
      products: '/api/products',
      inventory: '/api/inventory',
      enquiries: '/api/enquiries',
      quotations: '/api/quotations',
      orders: '/api/orders',
      dispatches: '/api/dispatches',
    },
    frontendUrl: 'http://localhost:3000',
  });
});

app.get('/api/health', (_req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

export default app;
