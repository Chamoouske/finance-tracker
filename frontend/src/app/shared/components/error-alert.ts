import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
    selector: 'app-error-alert',
    standalone: true,
    template: `
    @if (message) {
      <div
        class="mb-4 flex items-start gap-3 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fill-rule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clip-rule="evenodd"
          />
        </svg>
        <div class="flex-1">{{ message }}</div>
        @if (dismissible) {
          <button
            type="button"
            class="flex-shrink-0 text-red-500 hover:text-red-700"
            (click)="dismiss.emit()"
          >
            <span class="sr-only">Fechar</span>
            <svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path
                fill-rule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clip-rule="evenodd"
              />
            </svg>
          </button>
        }
      </div>
    }
  `,
})
export class ErrorAlert {
    @Input() message = '';
    @Input() dismissible = true;
    @Output() dismiss = new EventEmitter<void>();
}
