import { Component, inject, input, output, signal } from '@angular/core';

@Component({
    selector: 'app-confirm-dialog',
    standalone: true,
    template: `
    @if (isOpen()) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        (click)="onCancel()"
      >
        <div
          class="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
          (click)="$event.stopPropagation()"
        >
          <h3 class="text-lg font-semibold text-gray-900">{{ title() }}</h3>
          <p class="mt-2 text-sm text-gray-600">{{ message() }}</p>

          <div class="mt-6 flex justify-end gap-3">
            <button
              type="button"
              class="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              (click)="onCancel()"
            >
              {{ cancelText() }}
            </button>
            <button
              type="button"
              class="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              (click)="onConfirm()"
            >
              {{ confirmText() }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class ConfirmDialog {
    readonly isOpen = input(false);
    readonly title = input('Confirmar');
    readonly message = input('Tem certeza que deseja realizar esta ação?');
    readonly confirmText = input('Confirmar');
    readonly cancelText = input('Cancelar');

    readonly confirmed = output<void>();
    readonly cancelled = output<void>();

    onConfirm(): void {
        this.confirmed.emit();
    }

    onCancel(): void {
        this.cancelled.emit();
    }
}
