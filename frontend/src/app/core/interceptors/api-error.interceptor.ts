import { HttpErrorResponse, type HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

/**
 * HttpErrorInterceptor
 * SRP: Responsabilidade única — interceptar e padronizar erros HTTP.
 * DIP: Depende de abstrações (HttpInterceptorFn), não de implementações concretas.
 *
 * Mapeia os códigos de erro da API para mensagens em português.
 */
export const apiErrorInterceptor: HttpInterceptorFn = (req, next) => {
    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            let message = 'Erro inesperado. Tente novamente.';

            if (error.error?.error?.message) {
                message = error.error.error.message;
            } else if (error.error?.message) {
                message = error.error.message;
            } else if (error.status === 0) {
                message = 'Não foi possível conectar ao servidor. Verifique sua conexão.';
            } else if (error.status === 500) {
                message = 'Erro interno do servidor. Tente novamente mais tarde.';
            }

            const appError: AppHttpError = {
                status: error.status,
                code: error.error?.error?.code ?? 'unknown_error',
                message,
                originalError: error,
            };

            return throwError(() => appError);
        })
    );
};

export interface AppHttpError {
    status: number;
    code: string;
    message: string;
    originalError: HttpErrorResponse;
}
