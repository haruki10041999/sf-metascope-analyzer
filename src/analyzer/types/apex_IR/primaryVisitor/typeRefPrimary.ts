import { TypeRefPrimaryContext } from '@apexdevtools/apex-parser';

import { TypeRefTypeClass } from '../typeVisitor';
import {
    ApexCommonTypeClass,
    createNode,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { type FieldsOf, SourceSpan, TypeField } from '../../commons/ir';

export type TypeRefPrimaryType = TypeField<'typeRefPrimary'> & {
    value: TypeRefTypeClass;
};

export class TypeRefPrimaryTypeClass extends ApexCommonTypeClass<
    'typeRefPrimary',
    TypeRefPrimaryType
> {
    private constructor(fields: FieldsOf<TypeRefPrimaryType>, sourceSpan: SourceSpan) {
        super('typeRefPrimary', fields, sourceSpan);
    }

    static create(ctx: TypeRefPrimaryContext): TypeRefPrimaryTypeClass {
        return new TypeRefPrimaryTypeClass(
            { value: createNode(ctx.typeRef(), (c) => TypeRefTypeClass.create(c), 'typeRef') },
            getSourceSpan(ctx),
        );
    }

    getValue(): TypeRefPrimaryType['value'] {
        return this.getFields().value;
    }
}

export const isTypeRefPrimaryType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is TypeRefPrimaryTypeClass => isSpicifyApexCommonTypeClass('typeRefPrimary', target);
