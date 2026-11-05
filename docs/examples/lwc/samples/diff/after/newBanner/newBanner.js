import { LightningElement, api } from 'lwc';
import BANNER_LABEL from '@salesforce/label/c.BannerMessage';

export default class NewBanner extends LightningElement {
    @api message = BANNER_LABEL;
    @api variant = 'info';

    handleClose() {
        this.dispatchEvent(new CustomEvent('close'));
    }
}
