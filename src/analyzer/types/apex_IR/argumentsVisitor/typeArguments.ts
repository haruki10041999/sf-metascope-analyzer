import { TypeArgumentsContext } from '@apexdevtools/apex-parser';

import { ArgumentsTypeClass } from '.';

import { TypeListTypeClass, ListVisitor, isTypeListType } from '../listVisitor';

import { ErrorTypeClass, CommonTypeClass, isValidClass } from '../commonVisitor';

export class TypeArgumentsTypeClass extends ArgumentsTypeClass<TypeListTypeClass> {
    private constructor(value: TypeListTypeClass | ErrorTypeClass | null) {
        super('typeArguments', value);
    }

    static create(ctx: TypeArgumentsContext): TypeArgumentsTypeClass {
        if (!ctx.LT() || !ctx.GT()) {
            throw new Error('値が異常です。TypeArgumentsContext: ' + ctx.getText());
        }

        let value: TypeListTypeClass | ErrorTypeClass | null = null;
        if (ctx.typeList()) {
            value = isValidClass(
                new ListVisitor().visit(ctx.typeList()),
                isTypeListType,
                'typeList',
            );
        }

        return new TypeArgumentsTypeClass(value);
    }
}

export const isTypeArgumentsType = (target: CommonTypeClass): target is TypeArgumentsTypeClass => {
    return target instanceof TypeArgumentsTypeClass;
};
