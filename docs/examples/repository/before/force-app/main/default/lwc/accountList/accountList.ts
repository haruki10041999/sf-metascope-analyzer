import { LightningElement, api, wire, track } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import { getRecord, getFieldValue } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getAccounts from '@salesforce/apex/AccountController.getAccounts';
import deleteAccount from '@salesforce/apex/AccountController.deleteAccount';
import NAME_FIELD from '@salesforce/schema/Account.Name';
import INDUSTRY_FIELD from '@salesforce/schema/Account.Industry';
import TITLE_LABEL from '@salesforce/label/c.AccountListTitle';
import type { Row, SortDirection } from 'c/utils';
import { formatAmount, toRows } from 'c/utils';

type ViewMode = 'table' | 'tile';

interface SelectDetail {
    recordId: string;
    index: number;
}

export default class AccountList extends NavigationMixin(LightningElement) {
    @api recordId!: string;
    @api title: string = TITLE_LABEL;
    @api maxRows?: number = 10;
    @track private rows: Row[] = [];
    viewMode: ViewMode = 'table';
    sortDirection: SortDirection = 'asc';
    error?: unknown;

    @wire(getRecord, { recordId: '$recordId', fields: [NAME_FIELD, INDUSTRY_FIELD] })
    record?: { data?: unknown; error?: unknown };

    @wire(getAccounts, { parentId: '$recordId', limitSize: '$maxRows' })
    wiredAccounts({ data, error }: { data?: unknown[]; error?: unknown }): void {
        if (data) {
            this.rows = toRows(data);
        } else if (error) {
            this.error = error;
        }
    }

    get parentName(): string | undefined {
        return getFieldValue(this.record?.data, NAME_FIELD) as string | undefined;
    }

    get hasRows(): boolean {
        return this.rows.length > 0;
    }

    get isTable(): boolean {
        return this.viewMode === 'table';
    }

    get totalAmount(): string {
        return formatAmount(this.rows.reduce((sum, row) => sum + (row.amount ?? 0), 0));
    }

    handleSelect(event: CustomEvent<SelectDetail>): void {
        const { recordId, index } = event.detail;
        this.dispatchEvent(
            new CustomEvent<SelectDetail>('accountselect', {
                detail: { recordId, index },
                bubbles: true,
                composed: false,
            }),
        );
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: { recordId, actionName: 'view' },
        });
    }

    async handleDelete(event: Event): Promise<void> {
        const recordId = (event.target as HTMLElement).dataset.id!;
        try {
            await deleteAccount({ recordId });
            this.dispatchEvent(new ShowToastEvent({ title: '削除しました', variant: 'success' }));
        } catch (error) {
            this.error = error;
        }
    }

    @api
    refresh(): void {
        this.refs.table?.focus();
    }
}
