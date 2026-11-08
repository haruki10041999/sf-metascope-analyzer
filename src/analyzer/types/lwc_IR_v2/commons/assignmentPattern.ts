import { isAssignmentPattern, type AssignmentPattern } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNode,
    visitNodeList,
    visitOptionalNode,
} from '../commonVisitor';
import { expressionVisitorEvaluatePairs, type ExpressionTypeClass } from '../expressionVisitor';
import {
    typeAnnotationTypePair,
    type TypeAnnotationTypeClass,
} from '../flowVisitor/typeAnnotation';
import {
    tSTypeAnnotationTypePair,
    type TSTypeAnnotationTypeClass,
} from '../typeScriptVisitor/tSTypeAnnotation';
import { arrayPatternTypePair, type ArrayPatternTypeClass } from './arrayPattern';
import { decoratorTypePair, type DecoratorTypeClass } from './decorator';
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

const assignmentPatternTypeAnnotationPairs = lazyPairs(
    () => [typeAnnotationTypePair, tSTypeAnnotationTypePair] as const,
);
const assignmentPatternDecoratorsPairs = lazyPairs(() => [decoratorTypePair] as const);
const assignmentPatternLeftPairs = lazyPairs(
    () =>
        [
            identifierTypePair,
            objectPatternTypePair,
            arrayPatternTypePair,
            memberExpressionTypePair,
            tSAsExpressionTypePair,
            tSSatisfiesExpressionTypePair,
            tSTypeAssertionTypePair,
            tSNonNullExpressionTypePair,
        ] as const,
);

export type AssignmentPatternFields = {
    typeAnnotation: TypeAnnotationTypeClass | TSTypeAnnotationTypeClass | LwcErrorTypeClass | null;
    optional: NonNullable<AssignmentPattern['optional']> | null;
    decorators: (DecoratorTypeClass | LwcErrorTypeClass)[] | null;
    left:
        | IdentifierTypeClass
        | ObjectPatternTypeClass
        | ArrayPatternTypeClass
        | MemberExpressionTypeClass
        | TSAsExpressionTypeClass
        | TSSatisfiesExpressionTypeClass
        | TSTypeAssertionTypeClass
        | TSNonNullExpressionTypeClass
        | LwcErrorTypeClass;
    right: ExpressionTypeClass | LwcErrorTypeClass;
};

export class AssignmentPatternTypeClass extends LwcCommonTypeClass<'assignmentPattern'> {
    private readonly value: AssignmentPatternFields;

    private constructor(value: AssignmentPatternFields) {
        super('assignmentPattern');
        this.value = value;
    }

    static create(target: AssignmentPattern, originalSource: string): AssignmentPatternTypeClass {
        return new AssignmentPatternTypeClass({
            typeAnnotation: visitOptionalNode(
                target.typeAnnotation,
                originalSource,
                assignmentPatternTypeAnnotationPairs(),
                'AssignmentPattern.typeAnnotation',
            ),
            optional: target.optional ?? null,
            decorators:
                target.decorators == null
                    ? null
                    : visitNodeList(
                          target.decorators,
                          originalSource,
                          assignmentPatternDecoratorsPairs(),
                          'AssignmentPattern.decorators',
                      ),
            left: visitNode(
                target.left,
                originalSource,
                assignmentPatternLeftPairs(),
                'AssignmentPattern.left',
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
    override getFields(): AssignmentPatternFields {
        return this.value;
    }

    getTypeAnnotation(): AssignmentPatternFields['typeAnnotation'] {
        return this.value.typeAnnotation;
    }

    getOptional(): AssignmentPatternFields['optional'] {
        return this.value.optional;
    }

    getDecorators(): AssignmentPatternFields['decorators'] {
        return this.value.decorators;
    }

    getLeft(): AssignmentPatternFields['left'] {
        return this.value.left;
    }

    getRight(): AssignmentPatternFields['right'] {
        return this.value.right;
    }
}

export const assignmentPatternTypePair: EvaluatePair<
    AssignmentPattern,
    AssignmentPatternTypeClass
> = makeEvaluatePair(isAssignmentPattern, (target, originalSource) =>
    AssignmentPatternTypeClass.create(target, originalSource),
);

export const isAssignmentPatternType = (
    target: LwcCommonTypeClass<string>,
): target is AssignmentPatternTypeClass => target instanceof AssignmentPatternTypeClass;
