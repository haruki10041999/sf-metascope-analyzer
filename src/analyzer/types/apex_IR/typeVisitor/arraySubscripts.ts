import { ArraySubscriptsContext } from '@apexdevtools/apex-parser';

import { TypeValueTypeClass } from '.';

import { CommonTypeClass } from '../commonVisitor';

export class ArraySubscriptsTypeClass extends TypeValueTypeClass<'arraySubscripts', number | null> {
    private constructor(value: number | null) {
        super('arraySubscripts', value);
    }

    static create(ctx: ArraySubscriptsContext): ArraySubscriptsTypeClass {
        if (ctx.LBRACK_list().length !== ctx.RBRACK_list().length) {
            throw new Error('値が異常です。ArraySubscriptsContext: ' + ctx.getText());
        }

        return new ArraySubscriptsTypeClass(
            ctx.LBRACK_list().length > 0 ? ctx.LBRACK_list().length : null,
        );
    }
}

export const isArraySubscriptsType = (
    target: CommonTypeClass<string>,
): target is ArraySubscriptsTypeClass => {
    return target instanceof ArraySubscriptsTypeClass;
};
