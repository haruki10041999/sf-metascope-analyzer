import { ElementValuePairContext } from '@apexdevtools/apex-parser';

import { PairTypeClass } from '.';

import { NormalIdTypeClass, IdVisitor, isNormalIdType } from '../idVisitor';
import { ElementValueTypeClass, ValueVisitor, isElementValueType } from '../valueVisitor';
import { ApexErrorTypeClass, ApexCommonTypeClass, isApexValidClass } from '../commonVisitor';

export class ElementValuePairTypeClass extends PairTypeClass<
    'elementValuePair',
    NormalIdTypeClass,
    ElementValueTypeClass
> {
    private constructor(
        left: NormalIdTypeClass | ApexErrorTypeClass,
        right: ElementValueTypeClass | ApexErrorTypeClass,
    ) {
        super('elementValuePair', left, right);
    }

    static create(ctx: ElementValuePairContext): ElementValuePairTypeClass {
        if (!ctx.id() && !ctx.elementValue()) {
            throw new Error('値が異常です。ElementValuePairContext: ' + ctx.getText());
        }

        return new ElementValuePairTypeClass(
            isApexValidClass(new IdVisitor().visit(ctx.id()), isNormalIdType, 'id'),
            isApexValidClass(
                new ValueVisitor().visit(ctx.elementValue()),
                isElementValueType,
                'elementValue',
            ),
        );
    }
}

export const isElementValuePairType = (
    target: ApexCommonTypeClass<string>,
): target is ElementValuePairTypeClass => {
    return target instanceof ElementValuePairTypeClass;
};
