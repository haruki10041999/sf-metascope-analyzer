import { VoidPrimaryContext } from '@apexdevtools/apex-parser';

import { PrimaryTypeClass } from '.';
import { CommonTypeClass } from '../commonVisitor';

export class VoidPrimaryTypeClass extends PrimaryTypeClass<string> {
    private constructor(value: string) {
        super('voidPrimary', value);
    }

    static create(ctx: VoidPrimaryContext): VoidPrimaryTypeClass {
        if (!ctx.VOID() || !ctx.CLASS()) {
            throw new Error('値が異常です。VoidPrimaryContext: ' + ctx);
        }

        return new VoidPrimaryTypeClass(ctx.VOID().getText() + '.' + ctx.CLASS().getText());
    }
}

export const isVoidPrimaryType = (target: CommonTypeClass): target is VoidPrimaryTypeClass => {
    return target instanceof VoidPrimaryTypeClass;
};

