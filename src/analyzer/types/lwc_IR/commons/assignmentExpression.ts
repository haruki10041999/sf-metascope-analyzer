import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isAssignmentExpression, type AssignmentExpression } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNode,
    getSourceSpan,
} from '../commonVisitor';
import { expressionVisitorEvaluatePairs, type ExpressionTypeClass } from '../expressionVisitor';
import { arrayPatternTypePair, type ArrayPatternTypeClass } from './arrayPattern';
import { identifierTypePair, type IdentifierTypeClass } from './identifier';
import { memberExpressionTypePair, type MemberExpressionTypeClass } from './memberExpression';
import { objectPatternTypePair, type ObjectPatternTypeClass } from './objectPattern';
import { tSAsExpressionTypePair, type TSAsExpressionTypeClass } from './tSAsExpression';
import {
    tSNonNullExpressionTypePair,
    type TSNonNullExpressionTypeClass,
} from './tSNonNullExpression';
import {
    tSSatisfiesExpressionTypePair,
    type TSSatisfiesExpressionTypeClass,
} from './tSSatisfiesExpression';
import { tSTypeAssertionTypePair, type TSTypeAssertionTypeClass } from './tSTypeAssertion';

const assignmentExpressionSimpleTargetPairs = lazyPairs(
    () =>
        [
            identifierTypePair,
            memberExpressionTypePair,
            tSAsExpressionTypePair,
            tSSatisfiesExpressionTypePair,
            tSTypeAssertionTypePair,
            tSNonNullExpressionTypePair,
        ] as const,
);
const assignmentExpressionTargetPairs = lazyPairs(
    () =>
        [
            ...assignmentExpressionSimpleTargetPairs(),
            arrayPatternTypePair,
            objectPatternTypePair,
        ] as const,
);

/** 代入先にできる、パターンでないもの。optional chaining (`a?.b`) は代入先にできない */
export type SimpleAssignmentTargetTypeClass =
    | IdentifierTypeClass
    | MemberExpressionTypeClass
    | TSAsExpressionTypeClass
    | TSSatisfiesExpressionTypeClass
    | TSTypeAssertionTypeClass
    | TSNonNullExpressionTypeClass;

/** 複合代入の演算子 (`+=` など) */
export type CompoundAssignmentOperator = Exclude<AssignmentExpression['operator'], '='>;

/** パターン (`[a, b] = x`) を左辺にできるのは `=` だけ */
export type AssignmentExpressionFields = TypeField<'assignmentExpression'> & {
    right: ExpressionTypeClass;
} & (
        | {
              operator: '=';
              left:
                  SimpleAssignmentTargetTypeClass | ArrayPatternTypeClass | ObjectPatternTypeClass;
          }
        | { operator: CompoundAssignmentOperator; left: SimpleAssignmentTargetTypeClass }
    );

export class AssignmentExpressionTypeClass extends LwcCommonTypeClass<
    'assignmentExpression',
    AssignmentExpressionFields
> {
    private constructor(value: FieldsOf<AssignmentExpressionFields>, sourceSpan: SourceSpan) {
        super('assignmentExpression', value, sourceSpan);
    }

    static create(
        target: AssignmentExpression,
        originalSource: string,
    ): AssignmentExpressionTypeClass {
        const right = visitNode(
            target.right,
            originalSource,
            expressionVisitorEvaluatePairs(),
            'ExpressionVisitor',
        );
        return new AssignmentExpressionTypeClass(
            target.operator === '='
                ? {
                      operator: target.operator,
                      left: visitNode(
                          target.left,
                          originalSource,
                          assignmentExpressionTargetPairs(),
                          'AssignmentExpression.left',
                      ),
                      right,
                  }
                : {
                      operator: target.operator,
                      left: visitNode(
                          target.left,
                          originalSource,
                          assignmentExpressionSimpleTargetPairs(),
                          'AssignmentExpression.left',
                      ),
                      right,
                  },
            getSourceSpan(target, originalSource),
        );
    }

    getOperator(): AssignmentExpressionFields['operator'] {
        return this.getFields().operator;
    }

    getLeft(): AssignmentExpressionFields['left'] {
        return this.getFields().left;
    }

    getRight(): AssignmentExpressionFields['right'] {
        return this.getFields().right;
    }
}

export const assignmentExpressionTypePair: EvaluatePair<
    AssignmentExpression,
    AssignmentExpressionTypeClass
> = makeEvaluatePair(isAssignmentExpression, (target, originalSource) =>
    AssignmentExpressionTypeClass.create(target, originalSource),
);

export const isAssignmentExpressionType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is AssignmentExpressionTypeClass => target instanceof AssignmentExpressionTypeClass;
