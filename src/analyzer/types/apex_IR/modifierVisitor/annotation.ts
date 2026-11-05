import { AnnotationContext } from '@apexdevtools/apex-parser';

import { ModifierTypeClass } from '../modifierVisitor';

import { NormalIdTypeClass, IdVisitor, isNormalIdType } from '../idVisitor';
import { ElementValueTypeClass, ValueVisitor, isElementValueType } from '../valueVisitor';
import { ElementValuePairsTypeClass, PairVisitor, isElementValuePairsType } from '../pairVisitor';
import { ApexErrorTypeClass, ApexCommonTypeClass, visitNode } from '../commonVisitor';

export class AnnotationTypeClass extends ModifierTypeClass<'annotation', NormalIdTypeClass> {
    private param: ElementValueTypeClass | ElementValuePairsTypeClass | ApexErrorTypeClass | null =
        null;

    private constructor(
        value: NormalIdTypeClass | ApexErrorTypeClass,
        param: ElementValueTypeClass | ElementValuePairsTypeClass | ApexErrorTypeClass | null,
    ) {
        super('annotation', value);
        this.param = param;
    }

    static create(ctx: AnnotationContext): AnnotationTypeClass {
        if (!ctx.id()) {
            throw new Error('値が異常です。AnnotationContext: ' + ctx.getText());
        }

        let param: ElementValueTypeClass | ElementValuePairsTypeClass | ApexErrorTypeClass | null =
            null;

        if (ctx.elementValue()) {
            param = visitNode(
                new ValueVisitor(),
                ctx.elementValue(),
                isElementValueType,
                'elementValue',
            );
        } else if (ctx.elementValuePairs()) {
            param = visitNode(
                new PairVisitor(),
                ctx.elementValuePairs(),
                isElementValuePairsType,
                'elementValuePairs',
            );
        }

        return new AnnotationTypeClass(
            visitNode(new IdVisitor(), ctx.id(), isNormalIdType, 'id'),
            param,
        );
    }

    getParam(): ElementValueTypeClass | ElementValuePairsTypeClass | ApexErrorTypeClass | null {
        return this.param;
    }
}

export const isAnnotationType = (
    target: ApexCommonTypeClass<string>,
): target is AnnotationTypeClass => {
    return target instanceof AnnotationTypeClass;
};
