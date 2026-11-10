import { IdCreatedNamePairContext } from '@apexdevtools/apex-parser';

import { AnyIdTypeClass } from '../idVisitor';
import { TypeListTypeClass } from '../listVisitor';
import {
    ApexCommonTypeClass,
    createNode,
    createOptionalNode,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type IdCreatedNamePairType = TypeField<'idCreatedNamePair'> & {
    left: AnyIdTypeClass;
    right: TypeListTypeClass | null;
};

export class IdCreatedNamePairTypeClass extends ApexCommonTypeClass<
    'idCreatedNamePair',
    IdCreatedNamePairType
> {
    private constructor(fields: FieldsOf<IdCreatedNamePairType>, sourceSpan: SourceSpan) {
        super('idCreatedNamePair', fields, sourceSpan);
    }

    static create(ctx: IdCreatedNamePairContext): IdCreatedNamePairTypeClass {
        return new IdCreatedNamePairTypeClass(
            {
                left: createNode(ctx.anyId(), (c) => AnyIdTypeClass.create(c), 'anyId'),
                // 型引数 `<...>` は任意（`new Account()`）
                right: createOptionalNode(
                    ctx.typeList(),
                    (c) => TypeListTypeClass.create(c),
                    'typeList',
                ),
            },
            getSourceSpan(ctx),
        );
    }

    getLeft(): IdCreatedNamePairType['left'] {
        return this.getFields().left;
    }

    getRight(): IdCreatedNamePairType['right'] {
        return this.getFields().right;
    }
}

export const isIdCreatedNamePairType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is IdCreatedNamePairTypeClass =>
    isSpicifyApexCommonTypeClass('idCreatedNamePair', target);
