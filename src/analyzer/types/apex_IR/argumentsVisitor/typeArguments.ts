import { TypeArgumentsContext } from '@apexdevtools/apex-parser';

import { ArgumentsTypeClass } from '.';

import { TypeListTypeClass, ListVisitor, isTypeListType } from '../listVisitor';

import { ErrorTypeClass, CommonTypeClass, isErrorType } from '../commonVisitor';

export class TypeArgumentsTypeClass extends ArgumentsTypeClass {
    private constructor(
        value: TypeListTypeClass | null,
        errorClasses: Record<string, ErrorTypeClass>,
    ) {
        super('typeArguments', value, errorClasses);
    }

    static create(ctx: TypeArgumentsContext): TypeArgumentsTypeClass {
        if (!ctx.typeList() && (!ctx.LT() || !ctx.GT())) {
            throw new Error('値が異常です。TypeArgumentsContext: ' + ctx.getText());
        }

        let value: TypeListTypeClass | null = null;
        const errorClasses: Record<string, ErrorTypeClass> = {};

        const listTypeClass = new ListVisitor().visit(ctx.typeList());
        if (isTypeListType(listTypeClass)) {
            value = listTypeClass;
        } else if (isErrorType(listTypeClass)) {
            errorClasses['value'] = listTypeClass;
        }

        return new TypeArgumentsTypeClass(value, errorClasses);
    }
}

export const isTypeArgumentsType = (target: CommonTypeClass): target is TypeArgumentsTypeClass => {
    return target instanceof TypeArgumentsTypeClass;
};
