import { IdCreatedNamePairContext } from '@apexdevtools/apex-parser';

import { PairTypeClass } from '.';

import { AnyIdTypeClass, IdVisitor, isAnyIdType } from '../idVisitor';
import { TypeListTypeClass, ListVisitor, isTypeListType } from '../listVisitor';
import {
    ApexErrorTypeClass,
    ApexCommonTypeClass,
    visitNode,
    visitOptionalNode,
} from '../commonVisitor';

export class IdCreatedNamePairTypeClass extends PairTypeClass<
    'idCreatedNamePair',
    AnyIdTypeClass,
    TypeListTypeClass | null
> {
    private constructor(
        left: AnyIdTypeClass | ApexErrorTypeClass,
        right: TypeListTypeClass | ApexErrorTypeClass | null,
    ) {
        super('idCreatedNamePair', left, right);
    }

    static create(ctx: IdCreatedNamePairContext): IdCreatedNamePairTypeClass {
        if (!ctx.anyId()) {
            throw new Error('値が異常です。IdCreatedNamePairContext: ' + ctx.getText());
        }

        return new IdCreatedNamePairTypeClass(
            visitNode(new IdVisitor(), ctx.anyId(), isAnyIdType, 'anyId'),
            // 型引数 `<...>` は任意（`new Account()`）
            visitOptionalNode(new ListVisitor(), ctx.typeList(), isTypeListType, 'typeList'),
        );
    }
}

export const isIdCreatedNamePairType = (
    target: ApexCommonTypeClass<string>,
): target is IdCreatedNamePairTypeClass => {
    return target instanceof IdCreatedNamePairTypeClass;
};
