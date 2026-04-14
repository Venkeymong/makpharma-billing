import { Routes } from '@angular/router';

export const routes: Routes = [

  /* ================= ROOT ================= */

  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },

  /* ================= AUTH ================= */

  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login')
        .then(m => m.Login)
  },

  /* ================= MAIN LAYOUT ================= */

  {
    path: '',
    loadComponent: () =>
      import('./layout/main-layout/main-layout')
        .then(m => m.MainLayout),

    children: [

      /* DASHBOARD */
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard/dashboard')
            .then(m => m.Dashboard)
      },

      /* MEDICINES */
      {
        path: 'medicines',
        loadComponent: () =>
          import('./features/medicines/medicine-list/medicine-list')
            .then(m => m.MedicineList)
      },

      /* CUSTOMERS */
      {
        path: 'customers',
        loadComponent: () =>
          import('./features/customers/customer-list/customer-list')
            .then(m => m.CustomerList)
      },

      /* BILLING POS */
      {
        path: 'billing',
        loadComponent: () =>
          import('./features/billing/billing-pos/billing-pos')
            .then(m => m.BillingPos)
      },

      /* INVOICE LIST */
      {
        path: 'invoices',
        loadComponent: () =>
          import('./features/invoices/invoice-list/invoice-list')
            .then(m => m.InvoiceList)
      },

      /* VIEW INVOICE */
      {
        path: 'invoice/:id',
        loadComponent: () =>
          import('./features/invoices/invoice-view/invoice-view')
            .then(m => m.InvoiceView)
      },

      /* 🔥 EDIT INVOICE (NEW) */
      {
        path: 'edit-invoice/:id',
        loadComponent: () =>
          import('./pages/edit-invoice/edit-invoice')
            .then(m => m.EditInvoiceComponent)
      },

      /* REPORTS */
      {
        path: 'reports',
        loadComponent: () =>
          import('./features/reports/reports/reports')
            .then(m => m.Reports)
      },

      /* PROFILE */
      {
        path: 'profile',
        loadComponent: () =>
          import('./features/profile/profile/profile')
            .then(m => m.Profile)
      }

    ]
  }

];