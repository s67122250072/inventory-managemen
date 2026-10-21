import React from 'react';
import { Routes, Route } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import DashboardPage from '../pages/DashboardPage';
import ProductPage from '../pages/ProductPage';
import ProductDetailPage from '../pages/ProductDetailPage';
import ProductFormPage from '../pages/ProductFormPage';
import StockPage from '../pages/StockPage';
import CategoryPage from '../pages/CategoryPage';
import SearchPage from '../pages/SearchPage';
import ReportPage from '../pages/ReportPage';
import UserPage from '../pages/UserPage';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="products" element={<ProductPage />} />
        <Route path="products/:id" element={<ProductDetailPage />} />
        <Route path="products/add" element={<ProductFormPage />} />
        <Route path="products/:id/edit" element={<ProductFormPage />} />
        <Route path="stock" element={<StockPage />} />
        <Route path="categories" element={<CategoryPage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="reports" element={<ReportPage />} />
        <Route path="users" element={<UserPage />} />
      </Route>
    </Routes>
  );
}