import { TypeListContext } from '@apexdevtools/apex-parser';

import { ListTypeClass } from '../listVisitor';

import { TypeRefTypeClass, TypeVisitor, isTypeRefType } from '../typeVisitor';

import { ErrorTypeClass, CommonTypeClass, isValidClassList } from '../commonVisitor';

export class TypeListTypeClass extends ListTypeClass<TypeRefTypeClass> {
    private constructor(value: (TypeRefTypeClass | ErrorTypeClass)[]) {
        super('typeList', value);
    }

    static create(ctx: TypeListContext): TypeListTypeClass {
        if (!ctx.typeRef_list() || ctx.typeRef_list().length === 0) {
            throw new Error('値が異常です。TypeListContext: ' + ctx.getText());
        }

        return new TypeListTypeClass(
            isValidClassList(
                ctx.typeRef_list(),
                (ctx) => new TypeVisitor().visit(ctx),
                isTypeRefType,
                'typeRef',
            ),
        );
    }
}

export const isTypeListType = (target: CommonTypeClass): target is TypeListTypeClass => {
    return target instanceof TypeListTypeClass;
};
