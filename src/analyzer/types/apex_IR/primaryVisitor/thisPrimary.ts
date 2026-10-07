import { ThisPrimaryContext } from '@apexdevtools/apex-parser';

import { PrimaryTypeClass } from '.';
import { CommonTypeClass } from '../commonVisitor';

export class ThisPrimaryTypeClass extends PrimaryTypeClass<string> {
    private constructor(value: string) {
        super('thisPrimary', value);
    }

    static create(ctx: ThisPrimaryContext): ThisPrimaryTypeClass {
        if (!ctx.THIS()) {
            throw new Error('値が異常です。ThisPrimaryContext: ' + ctx.getText());
        }

        return new ThisPrimaryTypeClass(ctx.THIS().getText());
    }
}

export const isThisPrimaryType = (target: CommonTypeClass): target is ThisPrimaryTypeClass => {
    return target instanceof ThisPrimaryTypeClass;
};

