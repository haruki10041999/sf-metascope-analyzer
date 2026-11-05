import { LightningElement, api } from 'lwc';
export default class Demo extends LightningElement {
    @api title = '取引先';
    columns = [
        { label: '名前', fieldName: 'Name' },
        { label: '売上', fieldName: 'Amount', type: 'currency' },
    ];
    rows = [
        { Id: '1', Name: 'Acme', Amount: 1200 },
        { Id: '2', Name: '日本商事', Amount: 3400 },
    ];
    options = [
        { label: '有効', value: 'active' },
        { label: '無効', value: 'inactive' },
    ];
}
