import { IdCreatedNamePairContext } from '@apexdevtools/apex-parser';

import { DoublePairTypeClass } from '.';

import { AnyIdTypeClass, IdVisitor, isAnyIdType } from '../idVisitor';
import { TypeListTypeClass, ListVisitor, isTypeListType } from '../listVisitor';
import { ErrorTypeClass, CommonTypeClass, isErrorType } from '../commonVisitor';

export class IdCreatedNamePairTypeClass extends DoublePairTypeClass<
    AnyIdTypeClass,
    TypeListTypeClass
> {
    private constructor(
        left: AnyIdTypeClass | null,
        right: TypeListTypeClass | null,
        errorClasses: Record<string, ErrorTypeClass>,
    ) {
        super('idCreatedNamePair', left, right, errorClasses);
    }

    static create(ctx: IdCreatedNamePairContext): IdCreatedNamePairTypeClass {
        if (!ctx.anyId() || !ctx.typeList()) {
            throw new Error('値が異常です。IdCreatedNamePairContext: ' + ctx.getText());
        }

        let left: AnyIdTypeClass | null = null;
        let right: TypeListTypeClass | null = null;
        const errorClasses: Record<string, ErrorTypeClass> = {};

        const idTypeClass = new IdVisitor().visit(ctx.anyId());
        const listTypeClass = new ListVisitor().visit(ctx.typeList());

        if (isAnyIdType(idTypeClass)) {
            left = idTypeClass;
        } else if (isErrorType(idTypeClass)) {
            errorClasses['left'] = idTypeClass;
        }
        if (isTypeListType(listTypeClass)) {
            right = listTypeClass;
        } else if (isErrorType(listTypeClass)) {
            errorClasses['right'] = listTypeClass;
        }

        return new IdCreatedNamePairTypeClass(left, right, errorClasses);
    }
}

export const isIdCreatedNamePairType = (
    target: CommonTypeClass,
): target is IdCreatedNamePairTypeClass => {
    return target instanceof IdCreatedNamePairTypeClass;
};
