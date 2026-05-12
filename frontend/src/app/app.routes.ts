import { type Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('./core/layouts/main-layout').then((c) => c.MainLayout),
        children: [
            {
                path: '',
                loadComponent: () => import('./features/dashboard/dashboard').then((c) => c.default),
                title: 'Dashboard - Finance Tracker',
            },
            {
                path: 'overview',
                loadComponent: () => import('./features/overview/overview').then((c) => c.default),
                title: 'Visão Geral - Finance Tracker',
            },
            {
                path: 'transactions',
                loadComponent: () => import('./features/transactions/transactions-list').then((c) => c.default),
                title: 'Transações - Finance Tracker',
            },
            {
                path: 'transactions/new',
                loadComponent: () => import('./features/transactions/transaction-form').then((c) => c.default),
                title: 'Nova Transação - Finance Tracker',
            },
            {
                path: 'categories',
                loadComponent: () => import('./features/categories/categories').then((c) => c.default),
                title: 'Categorias - Finance Tracker',
            },
            {
                path: 'periods',
                loadComponent: () => import('./features/periods/periods').then((c) => c.default),
                title: 'Períodos - Finance Tracker',
            },
            {
                path: '**',
                redirectTo: '',
            },
        ],
    },
];
