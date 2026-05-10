import { Component, Input } from '@angular/core';

@Component({
    selector: 'app-page-header',
    standalone: true,
    template: `
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">{{ title }}</h1>
      @if (description) {
        <p class="mt-1 text-sm text-gray-500">{{ description }}</p>
      }
    </div>
  `,
})
export class PageHeader {
    @Input() title = '';
    @Input() description?: string;
}
