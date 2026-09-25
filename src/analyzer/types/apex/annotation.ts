import { AnnotationContext } from '@apexdevtools/apex-parser';

import { IdType, IdVisitor } from './idVisitor';
import { ValueType, ValueVisitor } from './valueVisitor';
import { ElementValuePairsType, makeElementValuePairsType } from './elementValuePairs';

export type AnnotationType = {
    type: 'annotation';
    annotation: Omit<IdType, 'type'>;
    value?: Omit<ValueType, 'type'>;
    pairs?: Omit<ElementValuePairsType, 'type'>;
};

export const makeAnnotationType = (ctx: AnnotationContext): AnnotationType => {
    const annotation = new IdVisitor().visit(ctx.id());

    if (ctx.elementValue()) {
        const { type, ...value } = new ValueVisitor().visit(ctx.elementValue());
        return {
            type: 'annotation',
            annotation: annotation,
            value: value,
        };
    }

    if (ctx.elementValuePairs()) {
        const { type, ...pairs } = makeElementValuePairsType(ctx.elementValuePairs());
        return {
            type: 'annotation',
            annotation: annotation,
            pairs: pairs,
        };
    }

    return {
        type: 'annotation',
        annotation: annotation,
    };
};

