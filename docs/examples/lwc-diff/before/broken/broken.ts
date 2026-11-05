import { LightningElement, api, track } from 'lwc';

export default class Broken extends LightningElement {
    @api @track value: string = '';
}
