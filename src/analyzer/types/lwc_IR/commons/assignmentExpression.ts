import { isAssignmentExpression, type AssignmentExpression } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNode,
} from '../commonVisitor';
import { expressionVisitorEvaluatePairs, type ExpressionTypeClass } from '../expressionVisitor';
import { arrayPatternTypePair, type ArrayPatternTypeClass } from './arrayPattern';
import { identifierTypePair, type IdentifierTypeClass } from './identifier';
import { memberExpressionTypePair, type MemberExpressionTypeClass } from './memberExpression';
import { objectPatternTypePair, type ObjectPatternTypeClass } from './objectPattern';
import {
    optionalMemberExpressionTypePair,
    type OptionalMemberExpressionTypeClass,
} from './optionalMemberExpression';
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

const assignmentExpressionLeftPairs = lazyPairs(
    () =>
        [
            identifierTypePair,
            memberExpressionTypePair,
            optionalMemberExpressionTypePair,
            arrayPatternTypePair,
            objectPatternTypePair,
            tSAsExpressionTypePair,
            tSSatisfiesExpressionTypePair,
            tSTypeAssertionTypePair,
            tSNonNullExpressionTypePair,
        ] as const,
);

export type AssignmentExpressionFields = {
    operator: AssignmentExpression['operator'];
    left:
        | IdentifierTypeClass
        | MemberExpressionTypeClass
        | OptionalMemberExpressionTypeClass
        | ArrayPatternTypeClass
        | ObjectPatternTypeClass
        | TSAsExpressionTypeClass
        | TSSatisfiesExpressionTypeClass
        | TSTypeAssertionTypeClass
        | TSNonNullExpressionTypeClass
        | LwcErrorTypeClass;
    right: ExpressionTypeClass | LwcErrorTypeClass;
};

export class AssignmentExpressionTypeClass extends LwcCommonTypeClass<'assignmentExpression'> {
    private readonly value: AssignmentExpressionFields;

    private constructor(value: AssignmentExpressionFields) {
        super('assignmentExpression');
        this.value = value;
    }

    static create(
        target: AssignmentExpression,
        originalSource: string,
    ): AssignmentExpressionTypeClass {
        return new AssignmentExpressionTypeClass({
            operator: target.operator,
            left: visitNode(
                target.left,
                originalSource,
                assignmentExpressionLeftPairs(),
                'AssignmentExpression.left',
            ),
            right: visitNode(
                target.right,
                originalSource,
                expressionVisitorEvaluatePairs(),
                'ExpressionVisitor',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): AssignmentExpressionFields {
        return this.value;
    }

    getOperator(): AssignmentExpressionFields['operator'] {
        return this.value.operator;
    }

    getLeft(): AssignmentExpressionFields['left'] {
        return this.value.left;
    }

    getRight(): AssignmentExpressionFields['right'] {
        return this.value.right;
    }
}

export const assignmentExpressionTypePair: EvaluatePair<
    AssignmentExpression,
    AssignmentExpressionTypeClass
> = makeEvaluatePair(isAssignmentExpression, (target, originalSource) =>
    AssignmentExpressionTypeClass.create(target, originalSource),
);

export const isAssignmentExpressionType = (
    target: LwcCommonTypeClass<string>,
): target is AssignmentExpressionTypeClass => target instanceof AssignmentExpressionTypeClass;
