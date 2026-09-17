import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CustomerList from './pages/Customers/CustomerList';
import ProductList from './pages/Products/ProductList';
import InventoryList from './pages/Inventory/InventoryList';
import InventoryAudit from './pages/Inventory/InventoryAudit';
import EnquiryList from './pages/Enquiries/EnquiryList';
import QuotationList from './pages/Quotations/QuotationList';
import OrderList from './pages/Orders/OrderList';
import DispatchList from './pages/Dispatches/DispatchList';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<Layout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/customers" element={<CustomerList />} />
            <Route path="/products" element={<ProductList />} />
            <Route path="/inventory" element={<InventoryList />} />
            <Route path="/inventory/audit" element={<InventoryAudit />} />
            <Route path="/enquiries" element={<EnquiryList />} />
            <Route path="/quotations" element={<QuotationList />} />
            <Route path="/orders" element={<OrderList />} />
            <Route path="/dispatches" element={<DispatchList />} />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
