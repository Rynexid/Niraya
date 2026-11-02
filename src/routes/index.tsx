import { createBrowserRouter, Navigate } from 'react-router-dom'

import { RequireAuth } from '@/components/auth/require-auth'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { RootLayout } from '@/components/layout/root-layout'
import { LoginPage } from '@/features/auth/login-page'
import { CategoriesPage } from '@/features/categories/categories-page'
import { CustomersPage } from '@/features/customers/customers-page'
import { DashboardPage } from '@/features/dashboard/dashboard-page'
import { HelpPage } from '@/features/help/help-page'
import { InventoryPage } from '@/features/inventory/inventory-page'
import { PosPage } from '@/features/pos/pages/pos-page'
import { ProductsPage } from '@/features/products/products-page'
import { ReportsPage } from '@/features/reports/reports-page'
import { SettingsPage } from '@/features/settings/settings-page'
import { ProfilePage } from '@/features/settings/profile-page'
import { StaffPage } from '@/features/staff/staff-page'
import { TransactionsPage } from '@/features/transactions/transactions-page'

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: 'login', element: <LoginPage /> },
      {
        element: (
          <RequireAuth>
            <DashboardLayout />
          </RequireAuth>
        ),
        children: [
          { index: true, element: <Navigate to="/dashboard" replace /> },
          { path: 'dashboard', element: <DashboardPage /> },
          { path: 'pos', element: <PosPage /> },
          { path: 'transactions', element: <TransactionsPage /> },
          { path: 'products', element: <ProductsPage /> },
          { path: 'categories', element: <CategoriesPage /> },
          { path: 'inventory', element: <InventoryPage /> },
          { path: 'customers', element: <CustomersPage /> },
          { path: 'staff', element: <StaffPage /> },
          { path: 'reports', element: <ReportsPage /> },
          { path: 'settings', element: <SettingsPage /> },
          { path: 'help', element: <HelpPage /> },
          { path: 'profile', element: <ProfilePage /> },
          { path: '*', element: <Navigate to="/dashboard" replace /> },
        ],
      },
    ],
  },
])
