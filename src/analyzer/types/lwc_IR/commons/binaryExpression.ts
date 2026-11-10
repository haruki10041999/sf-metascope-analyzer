import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isBinaryExpression, type BinaryExpression } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNode,
    getSourceSpan,
} from '../commonVisitor';
import { expressionVisitorEvaluatePairs, type ExpressionTypeClass } from '../expressionVisitor';
import { privateNameTypePair, type PrivateNameTypeClass } from './privateName';

const binaryExpressionInLeftPairs = lazyPairs(
    () => [...expressionVisitorEvaluatePairs(), privateNameTypePair] as const,
);

/** Babel 8 の BinaryExpressionIn | BinaryExpressionNotIn。left の PrivateName (`#x in obj`) は in のときだけ */
export type BinaryExpressionFields = TypeField<'binaryExpression'> & {
    right: ExpressionTypeClass;
} & (
        | { operator: 'in'; left: ExpressionTypeClass | PrivateNameTypeClass }
        | {
              operator: Exclude<BinaryExpression['operator'], 'in'>;
              left: ExpressionTypeClass;
          }
    );

export class BinaryExpressionTypeClass extends LwcCommonTypeClass<
    'binaryExpression',
    BinaryExpressionFields
> {
    private constructor(value: FieldsOf<BinaryExpressionFields>, sourceSpan: SourceSpan) {
        super('binaryExpression', value, sourceSpan);
    }

    static create(target: BinaryExpression, originalSource: string): BinaryExpressionTypeClass {
        const right = (): ExpressionTypeClass =>
            visitNode(
                target.right,
                originalSource,
                expressionVisitorEvaluatePairs(),
                'BinaryExpression.right',
            );
        return new BinaryExpressionTypeClass(
            target.operator === 'in'
                ? {
                      operator: target.operator,
                      left: visitNode(
                          target.left,
                          originalSource,
                          binaryExpressionInLeftPairs(),
                          'BinaryExpression.left',
                      ),
                      right: right(),
                  }
                : {
                      operator: target.operator,
                      left: visitNode(
                          target.left,
                          originalSource,
                          expressionVisitorEvaluatePairs(),
                          'BinaryExpression.left',
                      ),
                      right: right(),
                  },
            getSourceSpan(target, originalSource),
        );
    }

    getOperator(): BinaryExpressionFields['operator'] {
        return this.getFields().operator;
    }

    getLeft(): BinaryExpressionFields['left'] {
        return this.getFields().left;
    }

    getRight(): BinaryExpressionFields['right'] {
        return this.getFields().right;
    }
}

export const binaryExpressionTypePair: EvaluatePair<BinaryExpression, BinaryExpressionTypeClass> =
    makeEvaluatePair(isBinaryExpression, (target, originalSource) =>
        BinaryExpressionTypeClass.create(target, originalSource),
    );

export const isBinaryExpressionType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is BinaryExpressionTypeClass => target instanceof BinaryExpressionTypeClass;
