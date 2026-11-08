import { TypeRefPrimaryContext } from '@apexdevtools/apex-parser';

import { PrimaryTypeClass } from '.';

import { TypeRefTypeClass, TypeVisitor, isTypeRefType } from '../typeVisitor';
import { ApexErrorTypeClass, ApexCommonTypeClass, visitNode } from '../commonVisitor';

export class TypeRefPrimaryTypeClass extends PrimaryTypeClass<'typeRefPrimary', TypeRefTypeClass> {
    private constructor(value: TypeRefTypeClass | ApexErrorTypeClass) {
        super('typeRefPrimary', value);
    }

    static create(ctx: TypeRefPrimaryContext): TypeRefPrimaryTypeClass {
        if (!ctx.typeRef()) {
            throw new Error('値が異常です。TypeRefPrimaryContext: ' + ctx.getText());
        }

        return new TypeRefPrimaryTypeClass(
            visitNode(new TypeVisitor(), ctx.typeRef(), isTypeRefType, 'typeRef'),
        );
    }
}

export const isTypeRefPrimaryType = (
    target: ApexCommonTypeClass<string>,
): target is TypeRefPrimaryTypeClass => {
    return target instanceof TypeRefPrimaryTypeClass;
};
