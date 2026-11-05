import { TypeArgumentsContext } from '@apexdevtools/apex-parser';

import { ArgumentsTypeClass } from '.';

import { TypeListTypeClass, ListVisitor, isTypeListType } from '../listVisitor';

import { ApexErrorTypeClass, ApexCommonTypeClass, visitNode } from '../commonVisitor';

export class TypeArgumentsTypeClass extends ArgumentsTypeClass<'typeArguments', TypeListTypeClass> {
    private constructor(value: TypeListTypeClass | ApexErrorTypeClass | null) {
        super('typeArguments', value);
    }

    static create(ctx: TypeArgumentsContext): TypeArgumentsTypeClass {
        if (!ctx.LT() || !ctx.GT()) {
            throw new Error('値が異常です。TypeArgumentsContext: ' + ctx.getText());
        }

        let value: TypeListTypeClass | ApexErrorTypeClass | null = null;
        if (ctx.typeList()) {
            value = visitNode(new ListVisitor(), ctx.typeList(), isTypeListType, 'typeList');
        }

        return new TypeArgumentsTypeClass(value);
    }
}

export const isTypeArgumentsType = (
    target: ApexCommonTypeClass<string>,
): target is TypeArgumentsTypeClass => {
    return target instanceof TypeArgumentsTypeClass;
};
