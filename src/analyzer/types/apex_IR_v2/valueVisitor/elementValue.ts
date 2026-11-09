import { ElementValueContext } from '@apexdevtools/apex-parser';

import { LiteralTypeClass } from '../literalVisitor';
import {
    ApexCommonTypeClass,
    createNode,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type ElementValueType = TypeField<'elementValue'> & {
    value: LiteralTypeClass;
};

export class ElementValueTypeClass extends ApexCommonTypeClass<'elementValue', ElementValueType> {
    private constructor(fields: FieldsOf<ElementValueType>, sourceSpan: SourceSpan) {
        super('elementValue', fields, sourceSpan);
    }

    static create(ctx: ElementValueContext): ElementValueTypeClass {
        return new ElementValueTypeClass(
            {
                value: createNode(ctx.literal(), (c) => LiteralTypeClass.create(c), 'literal'),
            },
            getSourceSpan(ctx),
        );
    }

    getValue(): ElementValueType['value'] {
        return this.getFields().value;
    }
}

export const isElementValueType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is ElementValueTypeClass => {
    return isSpicifyApexCommonTypeClass('elementValue', target);
};
