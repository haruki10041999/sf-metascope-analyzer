import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isUnaryExpression, type UnaryExpression } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNode,
    getSourceSpan,
} from '../commonVisitor';
import { expressionVisitorEvaluatePairs, type ExpressionTypeClass } from '../expressionVisitor';
import { memberExpressionTypePair, type MemberExpressionTypeClass } from './memberExpression';
import {
    optionalMemberExpressionTypePair,
    type OptionalMemberExpressionTypeClass,
} from './optionalMemberExpression';

const unaryExpressionDeleteArgumentPairs = lazyPairs(
    () => [memberExpressionTypePair, optionalMemberExpressionTypePair] as const,
);

/**
 * 単項演算 (いつも前置)。LWC はモジュール (strict) なので、delete の対象はプロパティの参照だけ
 * (`delete x` は書けない)
 */
export type UnaryExpressionFields = TypeField<'unaryExpression'> &
    (
        | {
              operator: 'delete';
              argument: MemberExpressionTypeClass | OptionalMemberExpressionTypeClass;
          }
        | {
              operator: Exclude<UnaryExpression['operator'], 'delete'>;
              argument: ExpressionTypeClass;
          }
    );

export class UnaryExpressionTypeClass extends LwcCommonTypeClass<
    'unaryExpression',
    UnaryExpressionFields
> {
    private constructor(value: FieldsOf<UnaryExpressionFields>, sourceSpan: SourceSpan) {
        super('unaryExpression', value, sourceSpan);
    }

    static create(target: UnaryExpression, originalSource: string): UnaryExpressionTypeClass {
        return new UnaryExpressionTypeClass(
            target.operator === 'delete'
                ? {
                      operator: target.operator,
                      argument: visitNode(
                          target.argument,
                          originalSource,
                          unaryExpressionDeleteArgumentPairs(),
                          'UnaryExpression.argument (delete)',
                      ),
                  }
                : {
                      operator: target.operator,
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

    getArgument(): UnaryExpressionFields['argument'] {
        return this.getFields().argument;
    }

    getOperator(): UnaryExpressionFields['operator'] {
        return this.getFields().operator;
    }
}

export const unaryExpressionTypePair: EvaluatePair<UnaryExpression, UnaryExpressionTypeClass> =
    makeEvaluatePair(isUnaryExpression, (target, originalSource) =>
        UnaryExpressionTypeClass.create(target, originalSource),
    );

export const isUnaryExpressionType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is UnaryExpressionTypeClass => target instanceof UnaryExpressionTypeClass;
