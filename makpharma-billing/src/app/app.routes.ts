import { Routes } from '@angular/router';

export const routes: Routes = [

{
  path: '',
  redirectTo: 'login',
  pathMatch: 'full'
},

{
  path: 'login',
  loadComponent: () =>
    import('./features/auth/login/login')
      .then(m => m.Login)
},

{
  path: '',
  loadComponent: () =>
    import('./layout/main-layout/main-layout')
      .then(m => m.MainLayout),

  children: [

    {
      path: 'dashboard',
      loadComponent: () =>
        import('./features/dashboard/dashboard/dashboard')
          .then(m => m.Dashboard)
    },

    {
      path: 'medicines',
      loadComponent: () =>
        import('./features/medicines/medicine-list/medicine-list')
          .then(m => m.MedicineList)
    },

    {
path:'customers',
loadComponent: () =>
import('./features/customers/customer-list/customer-list')
.then(m => m.CustomerList)
},


{
path:'invoices',
loadComponent: () =>
import('./features/invoices/invoice-list/invoice-list')
.then(m => m.InvoiceList)
},

{
path:'reports',
loadComponent: () =>
import('./features/reports/reports/reports')
.then(m => m.Reports)
},

    {
path:'billing',
loadComponent: () =>
import('./features/billing/billing-pos/billing-pos')
.then(m => m.BillingPos)
},
{
path:'invoices',
loadComponent: () =>
import('./features/invoices/invoice-list/invoice-list')
.then(m => m.InvoiceList)
},
{
path:'invoice/:id',
loadComponent: () =>
import('./features/invoices/invoice-view/invoice-view')
.then(m => m.InvoiceView)
},
{
path:'reports',
loadComponent: () =>
import('./features/reports/reports/reports')
.then(m => m.Reports)
}

  ]
}

];