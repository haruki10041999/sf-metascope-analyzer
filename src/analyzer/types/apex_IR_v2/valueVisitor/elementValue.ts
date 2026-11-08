import { ElementValueContext } from '@apexdevtools/apex-parser';

import { NormalLiteralTypeClass, LiteralVisitor, isNormalLiteralType } from '../literalVisitor';
import {
    ApexErrorTypeClass,
    ApexCommonTypeClass,
    visitNode,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { SourceSpan } from '../../commons';
import { TypeField } from '../../commons/ir';

export type ElementValueType = TypeField<'elementValue'> & {
    value: NormalLiteralTypeClass;
};

export class ElementValueTypeClass extends ApexCommonTypeClass<'elementValue', ElementValueType> {
    private constructor(value: NormalLiteralTypeClass, sourceSpan: SourceSpan) {
        super('elementValue', { value: value }, sourceSpan);
    }

    static create(ctx: ElementValueContext) {
        return new ElementValueTypeClass(
            NormalLiteralTypeClass.create(ctx.literal()),
            getSourceSpan(ctx),
        );
    }
}

export const isElementValueType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is ElementValueTypeClass => {
    return isSpicifyApexCommonTypeClass('elementValue', target);
};
