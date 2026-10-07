import { IdCreatedNamePairContext } from '@apexdevtools/apex-parser';

import { PairTypeClass } from '.';

import { AnyIdTypeClass, IdVisitor, isAnyIdType } from '../idVisitor';
import { TypeListTypeClass, ListVisitor, isTypeListType } from '../listVisitor';
import { ErrorTypeClass, CommonTypeClass, isValidClass } from '../commonVisitor';

export class IdCreatedNamePairTypeClass extends PairTypeClass<
    AnyIdTypeClass,
    TypeListTypeClass | null
> {
    private constructor(
        left: AnyIdTypeClass | ErrorTypeClass,
        right: TypeListTypeClass | ErrorTypeClass | null,
    ) {
        super('idCreatedNamePair', left, right);
    }

    static create(ctx: IdCreatedNamePairContext): IdCreatedNamePairTypeClass {
        if (!ctx.anyId()) {
            throw new Error('値が異常です。IdCreatedNamePairContext: ' + ctx.getText());
        }

        return new IdCreatedNamePairTypeClass(
            isValidClass(new IdVisitor().visit(ctx.anyId()), isAnyIdType, 'anyId'),
            // 型引数 `<...>` は任意（`new Account()`）
            ctx.typeList()
                ? isValidClass(new ListVisitor().visit(ctx.typeList()), isTypeListType, 'typeList')
                : null,
        );
    }
}

export const isIdCreatedNamePairType = (
    target: CommonTypeClass,
): target is IdCreatedNamePairTypeClass => {
    return target instanceof IdCreatedNamePairTypeClass;
};
