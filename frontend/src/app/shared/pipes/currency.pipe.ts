import { Pipe, type PipeTransform } from '@angular/core';
import { CurrencyUtils } from '../../core/utils';

@Pipe({
    name: 'currencyBRL',
    standalone: true,
})
export class CurrencyBRLPipe implements PipeTransform {
    transform(value: number | null | undefined): string {
        if (value === null || value === undefined) return 'R$ 0,00';
        return CurrencyUtils.formatBRL(value);
    }
}
