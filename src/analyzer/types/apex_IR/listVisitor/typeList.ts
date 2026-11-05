import { TypeListContext } from '@apexdevtools/apex-parser';

import { ListTypeClass } from '../listVisitor';

import { TypeRefTypeClass, TypeVisitor, isTypeRefType } from '../typeVisitor';

import { ApexErrorTypeClass, ApexCommonTypeClass, visitNodeList } from '../commonVisitor';

export class TypeListTypeClass extends ListTypeClass<'typeList', TypeRefTypeClass> {
    private constructor(value: (TypeRefTypeClass | ApexErrorTypeClass)[]) {
        super('typeList', value);
    }

    static create(ctx: TypeListContext): TypeListTypeClass {
        if (!ctx.typeRef_list() || ctx.typeRef_list().length === 0) {
            throw new Error('値が異常です。TypeListContext: ' + ctx.getText());
        }

        return new TypeListTypeClass(
            visitNodeList(new TypeVisitor(), ctx.typeRef_list(), isTypeRefType, 'typeRef'),
        );
    }
}

export const isTypeListType = (
    target: ApexCommonTypeClass<string>,
): target is TypeListTypeClass => {
    return target instanceof TypeListTypeClass;
};
