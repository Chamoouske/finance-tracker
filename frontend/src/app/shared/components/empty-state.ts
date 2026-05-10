import { Component, Input } from '@angular/core';

@Component({
    selector: 'app-empty-state',
    standalone: true,
    template: `
    <div class="flex flex-col items-center justify-center py-16 text-center">
      <div class="mb-4 text-gray-400">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-16 w-16"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="1.5"
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
          />
        </svg>
      </div>
      <h3 class="text-lg font-medium text-gray-900">{{ title }}</h3>
      @if (message) {
        <p class="mt-1 text-sm text-gray-500">{{ message }}</p>
      }
      <ng-content />
    </div>
  `,
})
export class EmptyState {
    @Input() title = 'Nenhum dado encontrado';
    @Input() message?: string;
}
