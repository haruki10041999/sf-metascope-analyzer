import { TypeListContext } from '@apexdevtools/apex-parser';

import { TypeRefTypeClass } from '../typeVisitor';
import {
    ApexCommonTypeClass,
    createNodeList,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type TypeListType = TypeField<'typeList'> & {
    value: TypeRefTypeClass[];
};

export class TypeListTypeClass extends ApexCommonTypeClass<'typeList', TypeListType> {
    private constructor(fields: FieldsOf<TypeListType>, sourceSpan: SourceSpan) {
        super('typeList', fields, sourceSpan);
    }

    static create(ctx: TypeListContext): TypeListTypeClass {
        return new TypeListTypeClass(
            {
                value: createNodeList(
                    ctx.typeRef_list(),
                    (c) => TypeRefTypeClass.create(c),
                    'typeRef',
                ),
            },
            getSourceSpan(ctx),
        );
    }

    getValue(): TypeListType['value'] {
        return this.getFields().value;
    }
}

export const isTypeListType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is TypeListTypeClass => isSpicifyApexCommonTypeClass('typeList', target);
