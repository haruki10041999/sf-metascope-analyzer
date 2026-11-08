import { isSpreadElement, type SpreadElement } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    makeEvaluatePair,
    visitNode,
} from '../commonVisitor';
import { expressionVisitorEvaluatePairs, type ExpressionTypeClass } from '../expressionVisitor';

export type SpreadElementFields = {
    argument: ExpressionTypeClass | LwcErrorTypeClass;
};

export class SpreadElementTypeClass extends LwcCommonTypeClass<'spreadElement'> {
    private readonly value: SpreadElementFields;

    private constructor(value: SpreadElementFields) {
        super('spreadElement');
        this.value = value;
    }

    static create(target: SpreadElement, originalSource: string): SpreadElementTypeClass {
        return new SpreadElementTypeClass({
            argument: visitNode(
                target.argument,
                originalSource,
                expressionVisitorEvaluatePairs(),
                'ExpressionVisitor',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): SpreadElementFields {
        return this.value;
    }

    getArgument(): SpreadElementFields['argument'] {
        return this.value.argument;
    }
}

export const spreadElementTypePair: EvaluatePair<SpreadElement, SpreadElementTypeClass> =
    makeEvaluatePair(isSpreadElement, (target, originalSource) =>
        SpreadElementTypeClass.create(target, originalSource),
    );

export const isSpreadElementType = (
    target: LwcCommonTypeClass<string>,
): target is SpreadElementTypeClass => target instanceof SpreadElementTypeClass;
