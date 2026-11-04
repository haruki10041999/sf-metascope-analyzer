import { LightningElement, api, wire } from 'lwc';
import getAccounts from '@salesforce/apex/AccountController.getAccounts';
export default class Hello extends LightningElement {
    @api recordId;
    @api title = '取引先一覧';
    @wire(getAccounts, { id: '$recordId' }) accounts;
    get hasRows() { return this.rows.length > 0; }
    get rows() { return this.accounts?.data ?? []; }
    handleSelect() {}
}
