import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isSpreadElement, type SpreadElement } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    visitNode,
    getSourceSpan,
} from '../commonVisitor';
import { expressionVisitorEvaluatePairs, type ExpressionTypeClass } from '../expressionVisitor';

export type SpreadElementFields = TypeField<'spreadElement'> & {
    argument: ExpressionTypeClass;
};

export class SpreadElementTypeClass extends LwcCommonTypeClass<
    'spreadElement',
    SpreadElementFields
> {
    private constructor(value: FieldsOf<SpreadElementFields>, sourceSpan: SourceSpan) {
        super('spreadElement', value, sourceSpan);
    }

    static create(target: SpreadElement, originalSource: string): SpreadElementTypeClass {
        return new SpreadElementTypeClass(
            {
                argument: visitNode(
                    target.argument,
                    originalSource,
                    expressionVisitorEvaluatePairs(),
                    'ExpressionVisitor',
                ),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getArgument(): SpreadElementFields['argument'] {
        return this.getFields().argument;
    }
}

export const spreadElementTypePair: EvaluatePair<SpreadElement, SpreadElementTypeClass> =
    makeEvaluatePair(isSpreadElement, (target, originalSource) =>
        SpreadElementTypeClass.create(target, originalSource),
    );

export const isSpreadElementType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is SpreadElementTypeClass => target instanceof SpreadElementTypeClass;
