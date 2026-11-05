import { isTSAsExpression, type TSAsExpression } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    makeEvaluatePair,
    visitNode,
} from '../commonVisitor';
import { expressionVisitorEvaluatePairs, type ExpressionTypeClass } from '../expressionVisitor';
import { tSTypeVisitorEvaluatePairs, type TSTypeTypeClass } from '../tsTypeVisitor';

export type TSAsExpressionFields = {
    expression: ExpressionTypeClass | LwcErrorTypeClass;
    typeAnnotation: TSTypeTypeClass | LwcErrorTypeClass;
};

export class TSAsExpressionTypeClass extends LwcCommonTypeClass<'tSAsExpression'> {
    private readonly value: TSAsExpressionFields;

    private constructor(value: TSAsExpressionFields) {
        super('tSAsExpression');
        this.value = value;
    }

    static create(target: TSAsExpression, originalSource: string): TSAsExpressionTypeClass {
        return new TSAsExpressionTypeClass({
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
    override getFields(): TSAsExpressionFields {
        return this.value;
    }

    getExpression(): TSAsExpressionFields['expression'] {
        return this.value.expression;
    }

    getTypeAnnotation(): TSAsExpressionFields['typeAnnotation'] {
        return this.value.typeAnnotation;
    }
}

export const tSAsExpressionTypePair: EvaluatePair<TSAsExpression, TSAsExpressionTypeClass> =
    makeEvaluatePair(isTSAsExpression, (target, originalSource) =>
        TSAsExpressionTypeClass.create(target, originalSource),
    );

export const isTSAsExpressionType = (
    target: LwcCommonTypeClass<string>,
): target is TSAsExpressionTypeClass => target instanceof TSAsExpressionTypeClass;
