import { ElementValuePairContext } from '@apexdevtools/apex-parser';

import { IdTypeClass } from '../idVisitor';
import { ElementValueTypeClass } from '../valueVisitor';
import {
    ApexCommonTypeClass,
    createNode,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type ElementValuePairType = TypeField<'elementValuePair'> & {
    left: IdTypeClass;
    right: ElementValueTypeClass;
};

export class ElementValuePairTypeClass extends ApexCommonTypeClass<
    'elementValuePair',
    ElementValuePairType
> {
    private constructor(fields: FieldsOf<ElementValuePairType>, sourceSpan: SourceSpan) {
        super('elementValuePair', fields, sourceSpan);
    }

    static create(ctx: ElementValuePairContext): ElementValuePairTypeClass {
        return new ElementValuePairTypeClass(
            {
                left: createNode(ctx.id(), (c) => IdTypeClass.create(c), 'id'),
                right: createNode(
                    ctx.elementValue(),
                    (c) => ElementValueTypeClass.create(c),
                    'elementValue',
                ),
            },
            getSourceSpan(ctx),
        );
    }

    getLeft(): ElementValuePairType['left'] {
        return this.getFields().left;
    }

    getRight(): ElementValuePairType['right'] {
        return this.getFields().right;
    }
}

export const isElementValuePairType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is ElementValuePairTypeClass => isSpicifyApexCommonTypeClass('elementValuePair', target);
