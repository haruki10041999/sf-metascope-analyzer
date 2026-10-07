import { TypeRefPrimaryContext } from '@apexdevtools/apex-parser';

import { PrimaryTypeClass } from '.';

import { TypeRefTypeClass, TypeVisitor, isTypeRefType } from '../typeVisitor';
import { ErrorTypeClass, CommonTypeClass, isValidClass } from '../commonVisitor';

export class TypeRefPrimaryTypeClass extends PrimaryTypeClass<TypeRefTypeClass> {
    private constructor(value: TypeRefTypeClass | ErrorTypeClass) {
        super('typeRefPrimary', value);
    }

    static create(ctx: TypeRefPrimaryContext): TypeRefPrimaryTypeClass {
        if (!ctx.typeRef()) {
            throw new Error('値が異常です。TypeRefPrimaryContext: ' + ctx.getText());
        }

        return new TypeRefPrimaryTypeClass(
            isValidClass(new TypeVisitor().visit(ctx.typeRef()), isTypeRefType, 'typeRef'),
        );
    }
}

export const isTypeRefPrimaryType = (
    target: CommonTypeClass,
): target is TypeRefPrimaryTypeClass => {
    return target instanceof TypeRefPrimaryTypeClass;
};

