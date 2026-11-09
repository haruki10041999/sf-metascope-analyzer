import { ElementValuePairsContext } from '@apexdevtools/apex-parser';

import { ElementValuePairTypeClass } from './elementValuePair';
import {
    ApexCommonTypeClass,
    createNodeList,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type ElementValuePairsType = TypeField<'elementValuePairs'> & {
    value: ElementValuePairTypeClass[];
};

export class ElementValuePairsTypeClass extends ApexCommonTypeClass<
    'elementValuePairs',
    ElementValuePairsType
> {
    private constructor(fields: FieldsOf<ElementValuePairsType>, sourceSpan: SourceSpan) {
        super('elementValuePairs', fields, sourceSpan);
    }

    static create(ctx: ElementValuePairsContext): ElementValuePairsTypeClass {
        return new ElementValuePairsTypeClass(
            {
                value: createNodeList(
                    ctx.elementValuePair_list(),
                    (c) => ElementValuePairTypeClass.create(c),
                    'elementValuePair',
                ),
            },
            getSourceSpan(ctx),
        );
    }

    getValue(): ElementValuePairsType['value'] {
        return this.getFields().value;
    }
}

export const isElementValuePairsType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is ElementValuePairsTypeClass =>
    isSpicifyApexCommonTypeClass('elementValuePairs', target);
