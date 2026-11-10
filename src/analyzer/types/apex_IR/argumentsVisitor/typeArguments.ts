import { TypeArgumentsContext } from '@apexdevtools/apex-parser';

import { TypeListTypeClass } from '../listVisitor';
import {
    ApexCommonTypeClass,
    createNode,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type TypeArgumentsType = TypeField<'typeArguments'> & {
    /** 文法上 `<typeList>` の typeList は必須 */
    elements: TypeListTypeClass;
};

export class TypeArgumentsTypeClass extends ApexCommonTypeClass<
    'typeArguments',
    TypeArgumentsType
> {
    private constructor(fields: FieldsOf<TypeArgumentsType>, sourceSpan: SourceSpan) {
        super('typeArguments', fields, sourceSpan);
    }

    static create(ctx: TypeArgumentsContext): TypeArgumentsTypeClass {
        return new TypeArgumentsTypeClass(
            {
                elements: createNode(
                    ctx.typeList(),
                    (c) => TypeListTypeClass.create(c),
                    'typeList',
                ),
            },
            getSourceSpan(ctx),
        );
    }

    getElements(): TypeArgumentsType['elements'] {
        return this.getFields().elements;
    }
}

export const isTypeArgumentsType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is TypeArgumentsTypeClass => isSpicifyApexCommonTypeClass('typeArguments', target);
