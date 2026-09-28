import { AnnotationContext } from '@apexdevtools/apex-parser';

import { IdType, IdVisitor } from '../idVisitor';
import { ValueType, ValueVisitor } from '../valueVisitor';
import { PairType, PairVisitor } from '../pairVisitor';

export type AnnotationType = {
    type: 'annotation';
    modifier: {
        annotation: IdType;
        value?: ValueType;
        pairs?: PairType;
    };
};

export const makeAnnotationType = (ctx: AnnotationContext): AnnotationType => {
    const annotation = new IdVisitor().visit(ctx.id());

    if (ctx.elementValue()) {
        const value = new ValueVisitor().visit(ctx.elementValue());
        return {
            type: 'annotation',
            modifier: {
                annotation: annotation,
                value: value,
            },
        };
    }

    if (ctx.elementValuePairs()) {
        const pairs = new PairVisitor().visit(ctx.elementValuePairs());
        return {
            type: 'annotation',
            modifier: {
                annotation: annotation,
                pairs: pairs,
            },
        };
    }

    return {
        type: 'annotation',
        modifier: {
            annotation: annotation,
        },
    };
};

