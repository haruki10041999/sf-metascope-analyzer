import { PrimaryContext } from '@apexdevtools/apex-parser';

import { PrimaryTypeClass as primaryTypeClass } from '.';
import { CommonTypeClass } from '../commonVisitor';

export class PrimaryTypeClass extends primaryTypeClass {
    private constructor(value: string) {
        super('primary', value, []);
    }

    static create(ctx: PrimaryContext): PrimaryTypeClass {
        if (!ctx) {
            throw new Error('値が異常です。PrimaryContext: ' + ctx);
        }

        return new PrimaryTypeClass(ctx.getText());
    }
}

export const isPrimaryType = (target: CommonTypeClass): target is PrimaryTypeClass => {
    return target instanceof PrimaryTypeClass;
};
