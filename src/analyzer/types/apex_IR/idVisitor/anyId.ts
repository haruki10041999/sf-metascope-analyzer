import { AnyIdContext } from '@apexdevtools/apex-parser';

import { IdTypeClass } from '.';

import { CommonTypeClass } from '../commonVisitor';

export class AnyIdTypeClass extends IdTypeClass {
    private constructor(value: string) {
        super('anyId', value, {});
    }

    static create(ctx: AnyIdContext): AnyIdTypeClass {
        if (!ctx) {
            throw new Error('値が異常です。AnyIdContext: ' + ctx);
        }

        return new AnyIdTypeClass(ctx.getText());
    }
}

export const isAnyIdType = (target: CommonTypeClass): target is AnyIdTypeClass => {
    return target instanceof AnyIdTypeClass;
};
