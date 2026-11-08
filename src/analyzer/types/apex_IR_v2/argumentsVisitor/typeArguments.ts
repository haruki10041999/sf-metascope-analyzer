import { TypeArgumentsContext } from '@apexdevtools/apex-parser';

import { TypeListTypeClass } from '../listVisitor';

import {
    ApexErrorTypeClass,
    ApexCommonTypeClass,
    isSpicifyApexCommonTypeClass,
    getSourceSpan,
} from '../commonVisitor';
import { TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type TypeArgumentsType = TypeField<'typeArguments'> & {
    elements: TypeListTypeClass | null;
};

export class TypeArgumentsTypeClass extends ApexCommonTypeClass<
    'typeArguments',
    TypeArgumentsType
> {
    private constructor(elements: TypeListTypeClass | null, sourceSpan: SourceSpan) {
        super('typeArguments', { elements: elements }, sourceSpan);
    }

    static create(ctx: TypeArgumentsContext): TypeArgumentsTypeClass {
        let elements: TypeListTypeClass | null = null;
        if (ctx.typeList()) {
            elements = TypeListTypeClass.create(ctx.typeList());
        }

        return new TypeArgumentsTypeClass(elements, getSourceSpan(ctx));
    }

    getElements(): TypeArgumentsType['elements'] {
        return this.getFields().elements;
    }
}

export const isTypeArgumentsType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is TypeArgumentsTypeClass => {
    return isSpicifyApexCommonTypeClass('typeArguments', target);
};
