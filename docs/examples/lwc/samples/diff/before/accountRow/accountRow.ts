import { LightningElement, api } from 'lwc';
import { formatAmount } from 'c/utils';

export default class AccountRow extends LightningElement {
    @api recordId!: string;
    @api name: string = '';
    @api amount?: number;

    get formattedAmount(): string {
        return formatAmount(this.amount ?? 0);
    }

    handleClick(): void {
        this.dispatchEvent(new CustomEvent('select', { detail: { recordId: this.recordId } }));
    }
}
