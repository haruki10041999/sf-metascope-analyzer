import { ElementValuePairContext } from '@apexdevtools/apex-parser';

import { PairTypeClass } from '.';

import { NormalIdTypeClass, IdVisitor, isNormalIdType } from '../idVisitor';
import { ElementValueTypeClass, ValueVisitor, isElementValueType } from '../valueVisitor';
import { ErrorTypeClass, CommonTypeClass, isValidClass } from '../commonVisitor';

export class ElementValuePairTypeClass extends PairTypeClass<
    NormalIdTypeClass,
    ElementValueTypeClass
> {
    private constructor(
        left: NormalIdTypeClass | ErrorTypeClass,
        right: ElementValueTypeClass | ErrorTypeClass,
    ) {
        super('elementValuePair', left, right);
    }

    static create(ctx: ElementValuePairContext): ElementValuePairTypeClass {
        if (!ctx.id() && !ctx.elementValue()) {
            throw new Error('値が異常です。ElementValuePairContext: ' + ctx.getText());
        }

        return new ElementValuePairTypeClass(
            isValidClass(new IdVisitor().visit(ctx.id()), isNormalIdType, 'id'),
            isValidClass(
                new ValueVisitor().visit(ctx.elementValue()),
                isElementValueType,
                'elementValue',
            ),
        );
    }
}

export const isElementValuePairType = (
    target: CommonTypeClass,
): target is ElementValuePairTypeClass => {
    return target instanceof ElementValuePairTypeClass;
};
