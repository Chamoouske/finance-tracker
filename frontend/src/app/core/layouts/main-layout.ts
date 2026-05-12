import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import { PeriodNavigationService } from '../services/period-navigation.service';
import { DateUtils } from '../utils';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, AsyncPipe],
  template: `
    <div class="flex h-screen overflow-hidden bg-gray-50">
      <!-- Sidebar (mobile: hidden, desktop: fixed) -->
      <aside
        class="fixed inset-y-0 left-0 z-30 w-64 transform bg-white shadow-lg transition-transform duration-300 lg:static lg:translate-x-0"
        [class.-translate-x-full]="!sidebarOpen()"
      >
        <div class="flex h-full flex-col">
          <!-- Logo -->
          <div class="flex h-16 items-center justify-between border-b border-gray-200 px-6">
            <a routerLink="/" class="flex items-center gap-2 text-xl font-bold text-indigo-600">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z"/>
              </svg>
              Finance Tracker
            </a>
          </div>

          <!-- Period Navigation (Sticky no sidebar) -->
          <div class="border-b border-gray-200 px-4 py-4">
            @if (period$ | async; as period) {
              <div class="flex items-center justify-between">
                <button
                  class="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                  (click)="periodNav.previous()"
                  title="Mês anterior"
                >
                  <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                  </svg>
                </button>
                <span class="text-sm font-semibold text-gray-900 select-none">
                  {{ DateUtils.periodToMonthName(period) }}
                </span>
                <button
                  class="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                  (click)="periodNav.next()"
                  title="Próximo mês"
                >
                  <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                  </svg>
                </button>
              </div>
            }
          </div>

          <!-- Navigation -->
          <nav class="flex-1 space-y-1 px-3 py-4">
            @for (item of navItems; track item.path) {
              <a
                [routerLink]="item.path"
                routerLinkActive="bg-indigo-50 text-indigo-700"
                class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
                [routerLinkActiveOptions]="{ exact: item.exact }"
              >
                <span [innerHTML]="item.icon" class="h-5 w-5"></span>
                {{ item.label }}
              </a>
            }
          </nav>

          <!-- Footer -->
          <div class="border-t border-gray-200 px-6 py-4">
            <p class="text-xs text-gray-400">v1.0.0</p>
          </div>
        </div>
      </aside>

      <!-- Overlay (mobile) -->
      @if (sidebarOpen()) {
        <div
          class="fixed inset-0 z-20 bg-black/50 lg:hidden"
          (click)="toggleSidebar()"
        ></div>
      }

      <!-- Main Content -->
      <div class="flex flex-1 flex-col overflow-hidden">
        <!-- Top Bar (mobile) -->
        <header class="flex h-16 items-center border-b border-gray-200 bg-white px-4 lg:hidden">
          <button
            class="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
            (click)="toggleSidebar()"
          >
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          </button>
          <span class="ml-3 text-lg font-bold text-indigo-600">Finance Tracker</span>

          <!-- Mobile period nav -->
          @if (period$ | async; as period) {
            <div class="ml-auto flex items-center gap-2">
              <button class="p-1 text-gray-500" (click)="periodNav.previous()">
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                </svg>
              </button>
              <span class="text-xs font-medium text-gray-700">
                {{ DateUtils.periodToMonthName(period) }}
              </span>
              <button class="p-1 text-gray-500" (click)="periodNav.next()">
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                </svg>
              </button>
            </div>
          }
        </header>

        <!-- Page Content -->
        <main class="flex-1 overflow-y-auto p-4 lg:p-8">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
})
export class MainLayout {
  protected readonly periodNav = inject(PeriodNavigationService);
  protected readonly DateUtils = DateUtils;
  protected readonly period$ = this.periodNav.currentPeriod$;

  protected readonly sidebarOpen = signal(false);

  protected readonly navItems = [
    {
      path: '/',
      label: 'Dashboard',
      exact: true,
      icon: '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>',
    },
    {
      path: '/overview',
      label: 'Visão Geral',
      exact: false,
      icon: '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>',
    },
    {
      path: '/transactions',
      label: 'Transações',
      exact: false,
      icon: '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>',
    },
    {
      path: '/categories',
      label: 'Categorias',
      exact: false,
      icon: '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>',
    },
    {
      path: '/periods',
      label: 'Períodos',
      exact: false,
      icon: '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>',
    },
  ];

  toggleSidebar(): void {
    this.sidebarOpen.update((v) => !v);
  }
}
