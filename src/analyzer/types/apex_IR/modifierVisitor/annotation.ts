import { AnnotationContext } from '@apexdevtools/apex-parser';

import { ModifierTypeClass } from '../modifierVisitor';

import { NormalIdTypeClass, IdVisitor, isNormalIdType } from '../idVisitor';
import { ElementValueTypeClass, ValueVisitor, isElementValueType } from '../valueVisitor';
import { ElementValuePairsTypeClass, PairVisitor, isElementValuePairsType } from '../pairVisitor';
import { ErrorTypeClass, CommonTypeClass, isValidClass } from '../commonVisitor';

export class AnnotationTypeClass extends ModifierTypeClass<NormalIdTypeClass> {
    private param: ElementValueTypeClass | ElementValuePairsTypeClass | ErrorTypeClass | null =
        null;

    private constructor(
        value: NormalIdTypeClass | ErrorTypeClass,
        param: ElementValueTypeClass | ElementValuePairsTypeClass | ErrorTypeClass | null,
    ) {
        super('annotation', value);
        this.param = param;
    }

    static create(ctx: AnnotationContext): AnnotationTypeClass {
        if (!ctx.id()) {
            throw new Error('値が異常です。AnnotationContext: ' + ctx.getText());
        }

        let param: ElementValueTypeClass | ElementValuePairsTypeClass | ErrorTypeClass | null =
            null;

        if (ctx.elementValue()) {
            param = isValidClass(
                new ValueVisitor().visit(ctx.elementValue()),
                isElementValueType,
                'elementValue',
            );
        } else if (ctx.elementValuePairs()) {
            param = isValidClass(
                new PairVisitor().visit(ctx.elementValuePairs()),
                isElementValuePairsType,
                'elementValuePairs',
            );
        }

        return new AnnotationTypeClass(
            isValidClass(new IdVisitor().visit(ctx.id()), isNormalIdType, 'id'),
            param,
        );
    }

    getParam(): ElementValueTypeClass | ElementValuePairsTypeClass | ErrorTypeClass | null {
        return this.param;
    }
}

export const isAnnotationType = (target: CommonTypeClass): target is AnnotationTypeClass => {
    return target instanceof AnnotationTypeClass;
};

