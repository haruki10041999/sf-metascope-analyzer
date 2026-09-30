import { ArraySubscriptsContext } from '@apexdevtools/apex-parser';

import { TypeTypeClass } from '.';

import { CommonTypeClass } from '../commonVisitor';

export class ArraySubscriptsTypeClass extends TypeTypeClass<number> {
    private constructor(value: number | null) {
        super('arraySubscripts', value, {});
    }

    static create(ctx: ArraySubscriptsContext): ArraySubscriptsTypeClass {
        if (
            (ctx.LBRACK_list() && !ctx.RBRACK_list()) ||
            (ctx.RBRACK_list() && !ctx.LBRACK_list()) ||
            ctx.LBRACK_list().length !== ctx.RBRACK_list().length
        ) {
            throw new Error('値が異常です。ArraySubscriptsContext: ' + ctx.getText());
        }

        return new ArraySubscriptsTypeClass(ctx.LBRACK_list().length);
    }
}

export const isArraySubscriptsType = (
    target: CommonTypeClass,
): target is ArraySubscriptsTypeClass => {
    return target instanceof ArraySubscriptsTypeClass;
};
