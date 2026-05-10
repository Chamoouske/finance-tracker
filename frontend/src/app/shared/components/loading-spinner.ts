import { Component, Input } from '@angular/core';

@Component({
    selector: 'app-loading-spinner',
    standalone: true,
    template: `
    <div class="flex flex-col items-center justify-center py-12">
      <div
        class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"
        [class.h-6]="size === 'sm'"
        [class.w-6]="size === 'sm'"
        [class.h-10]="size === 'lg'"
        [class.w-10]="size === 'lg'"
        role="status"
      ></div>
      @if (message) {
        <p class="mt-3 text-sm text-gray-500">{{ message }}</p>
      }
    </div>
  `,
})
export class LoadingSpinner {
    @Input() size: 'sm' | 'md' | 'lg' = 'md';
    @Input() message?: string;
}
