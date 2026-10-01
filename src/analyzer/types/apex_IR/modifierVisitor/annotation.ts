import { AnnotationContext } from '@apexdevtools/apex-parser';

import { ModifierTypeClass } from '../modifierVisitor';

import { NormalIdTypeClass, IdVisitor, isNormalIdType } from '../idVisitor';
import { ElementValueTypeClass, ValueVisitor, isElementValueType } from '../valueVisitor';
import { ElementValuePairsTypeClass, PairVisitor, isElementValuePairsType } from '../pairVisitor';
import { ErrorTypeClass, CommonTypeClass, isErrorType } from '../commonVisitor';

export class AnnotationTypeClass extends ModifierTypeClass<NormalIdTypeClass> {
    private param: ElementValueTypeClass | ElementValuePairsTypeClass | null = null;

    private constructor(
        value: NormalIdTypeClass | null,
        param: ElementValueTypeClass | ElementValuePairsTypeClass | null,
        errorClasses: Record<string, ErrorTypeClass>,
    ) {
        super('annotation', value, errorClasses);
        this.param = param;
    }

    static create(ctx: AnnotationContext): AnnotationTypeClass {
        if (!ctx.id() || (ctx.elementValue() && ctx.elementValuePairs())) {
            throw new Error('値が異常です。AnnotationContext: ' + ctx.getText());
        }

        let value: NormalIdTypeClass | null = null;
        let param: ElementValueTypeClass | ElementValuePairsTypeClass | null = null;
        const errorTypeClasses: Record<string, ErrorTypeClass> = {};

        const idTypeClass = new IdVisitor().visit(ctx.id());
        if (isNormalIdType(idTypeClass)) {
            value = idTypeClass;
        } else if (isErrorType(idTypeClass)) {
            errorTypeClasses['id'] = idTypeClass;
        }

        if (ctx.elementValue()) {
            const valueTypeClass = new ValueVisitor().visit(ctx.elementValue());
            if (isElementValueType(valueTypeClass)) {
                param = valueTypeClass;
            } else if (isErrorType(valueTypeClass)) {
                errorTypeClasses['elementValue'] = valueTypeClass;
            }
        }

        if (ctx.elementValuePairs()) {
            const pairTypeClass = new PairVisitor().visit(ctx.elementValuePairs());
            if (isElementValuePairsType(pairTypeClass)) {
                param = pairTypeClass;
            } else if (isErrorType(pairTypeClass)) {
                errorTypeClasses['elementValuePairs'] = pairTypeClass;
            }
        }

        return new AnnotationTypeClass(value, param, errorTypeClasses);
    }

    getParam(): ElementValueTypeClass | ElementValuePairsTypeClass | null {
        return this.param;
    }

    isParamNull(): boolean {
        return this.param === null;
    }
}

export const isAnnotationType = (target: CommonTypeClass): target is AnnotationTypeClass => {
    return target instanceof AnnotationTypeClass;
};

