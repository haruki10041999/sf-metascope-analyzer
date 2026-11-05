import { isTSSatisfiesExpression, type TSSatisfiesExpression } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    makeEvaluatePair,
    visitNode,
} from '../commonVisitor';
import { expressionVisitorEvaluatePairs, type ExpressionTypeClass } from '../expressionVisitor';
import { tSTypeVisitorEvaluatePairs, type TSTypeTypeClass } from '../tsTypeVisitor';

export type TSSatisfiesExpressionFields = {
    expression: ExpressionTypeClass | LwcErrorTypeClass;
    typeAnnotation: TSTypeTypeClass | LwcErrorTypeClass;
};

export class TSSatisfiesExpressionTypeClass extends LwcCommonTypeClass<'tSSatisfiesExpression'> {
    private readonly value: TSSatisfiesExpressionFields;

    private constructor(value: TSSatisfiesExpressionFields) {
        super('tSSatisfiesExpression');
        this.value = value;
    }

    static create(
        target: TSSatisfiesExpression,
        originalSource: string,
    ): TSSatisfiesExpressionTypeClass {
        return new TSSatisfiesExpressionTypeClass({
            expression: visitNode(
                target.expression,
                originalSource,
                expressionVisitorEvaluatePairs(),
                'ExpressionVisitor',
            ),
            typeAnnotation: visitNode(
                target.typeAnnotation,
                originalSource,
                tSTypeVisitorEvaluatePairs(),
                'TSTypeVisitor',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): TSSatisfiesExpressionFields {
        return this.value;
    }

    getExpression(): TSSatisfiesExpressionFields['expression'] {
        return this.value.expression;
    }

    getTypeAnnotation(): TSSatisfiesExpressionFields['typeAnnotation'] {
        return this.value.typeAnnotation;
    }
}

export const tSSatisfiesExpressionTypePair: EvaluatePair<
    TSSatisfiesExpression,
    TSSatisfiesExpressionTypeClass
> = makeEvaluatePair(isTSSatisfiesExpression, (target, originalSource) =>
    TSSatisfiesExpressionTypeClass.create(target, originalSource),
);

export const isTSSatisfiesExpressionType = (
    target: LwcCommonTypeClass<string>,
): target is TSSatisfiesExpressionTypeClass => target instanceof TSSatisfiesExpressionTypeClass;
