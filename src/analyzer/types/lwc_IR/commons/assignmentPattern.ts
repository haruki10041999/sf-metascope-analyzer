import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isAssignmentPattern, type AssignmentPattern } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNode,
    visitOptionalNode,
    getSourceSpan,
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
import { DecoratorTypeClass } from './decorator';
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

export type AssignmentPatternFields = TypeField<'assignmentPattern'> & {
    typeAnnotation: TypeAnnotationTypeClass | TSTypeAnnotationTypeClass | null;
    optional: boolean;
    decorators: DecoratorTypeClass[] | null;
    left:
        | IdentifierTypeClass
        | ObjectPatternTypeClass
        | ArrayPatternTypeClass
        | MemberExpressionTypeClass
        | TSAsExpressionTypeClass
        | TSSatisfiesExpressionTypeClass
        | TSTypeAssertionTypeClass
        | TSNonNullExpressionTypeClass;
    right: ExpressionTypeClass;
};

export class AssignmentPatternTypeClass extends LwcCommonTypeClass<
    'assignmentPattern',
    AssignmentPatternFields
> {
    private constructor(value: FieldsOf<AssignmentPatternFields>, sourceSpan: SourceSpan) {
        super('assignmentPattern', value, sourceSpan);
    }

    static create(target: AssignmentPattern, originalSource: string): AssignmentPatternTypeClass {
        return new AssignmentPatternTypeClass(
            {
                typeAnnotation: visitOptionalNode(
                    target.typeAnnotation,
                    originalSource,
                    assignmentPatternTypeAnnotationPairs(),
                    'AssignmentPattern.typeAnnotation',
                ),
                optional: target.optional ?? false,
                decorators:
                    target.decorators == null
                        ? null
                        : target.decorators.map((child) =>
                              DecoratorTypeClass.create(child, originalSource),
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
            },
            getSourceSpan(target, originalSource),
        );
    }

    getTypeAnnotation(): AssignmentPatternFields['typeAnnotation'] {
        return this.getFields().typeAnnotation;
    }

    getOptional(): AssignmentPatternFields['optional'] {
        return this.getFields().optional;
    }

    getDecorators(): AssignmentPatternFields['decorators'] {
        return this.getFields().decorators;
    }

    getLeft(): AssignmentPatternFields['left'] {
        return this.getFields().left;
    }

    getRight(): AssignmentPatternFields['right'] {
        return this.getFields().right;
    }
}

export const assignmentPatternTypePair: EvaluatePair<
    AssignmentPattern,
    AssignmentPatternTypeClass
> = makeEvaluatePair(isAssignmentPattern, (target, originalSource) =>
    AssignmentPatternTypeClass.create(target, originalSource),
);

export const isAssignmentPatternType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is AssignmentPatternTypeClass => target instanceof AssignmentPatternTypeClass;
