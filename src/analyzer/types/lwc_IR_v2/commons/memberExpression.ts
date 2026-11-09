import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isMemberExpression, isSuper, type MemberExpression } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNode,
    getSourceSpan,
} from '../commonVisitor';
import { expressionVisitorEvaluatePairs, type ExpressionTypeClass } from '../expressionVisitor';
import { superTypePair, type SuperTypeClass } from '../standardizedVisitor/super';
import { identifierTypePair, type IdentifierTypeClass } from './identifier';
import { privateNameTypePair, type PrivateNameTypeClass } from './privateName';

const memberExpressionComputedObjectPairs = lazyPairs(
    () => [...expressionVisitorEvaluatePairs(), superTypePair] as const,
);
const memberExpressionSuperPairs = lazyPairs(() => [superTypePair] as const);
const memberExpressionIdentifierPairs = lazyPairs(() => [identifierTypePair] as const);
const memberExpressionStaticPropertyPairs = lazyPairs(
    () => [identifierTypePair, privateNameTypePair] as const,
);

/**
 * Babel 8 の MemberExpressionComputed | MemberExpressionNonComputed。
 * computed: false の property は Identifier・PrivateName。`super.#x` は書けないので、object が Super なら Identifier だけ
 */
export type MemberExpressionFields = TypeField<'memberExpression'> &
    (
        | {
              computed: false;
              object: ExpressionTypeClass;
              property: IdentifierTypeClass | PrivateNameTypeClass;
          }
        | { computed: false; object: SuperTypeClass; property: IdentifierTypeClass }
        | {
              computed: true;
              object: ExpressionTypeClass | SuperTypeClass;
              property: ExpressionTypeClass;
          }
    );

export class MemberExpressionTypeClass extends LwcCommonTypeClass<
    'memberExpression',
    MemberExpressionFields
> {
    private constructor(value: FieldsOf<MemberExpressionFields>, sourceSpan: SourceSpan) {
        super('memberExpression', value, sourceSpan);
    }

    static create(target: MemberExpression, originalSource: string): MemberExpressionTypeClass {
        const span = getSourceSpan(target, originalSource);
        if (target.computed) {
            return new MemberExpressionTypeClass(
                {
                    computed: true,
                    object: visitNode(
                        target.object,
                        originalSource,
                        memberExpressionComputedObjectPairs(),
                        'MemberExpression.object',
                    ),
                    property: visitNode(
                        target.property,
                        originalSource,
                        expressionVisitorEvaluatePairs(),
                        'MemberExpression.property',
                    ),
                },
                span,
            );
        }
        if (isSuper(target.object)) {
            return new MemberExpressionTypeClass(
                {
                    computed: false,
                    object: visitNode(
                        target.object,
                        originalSource,
                        memberExpressionSuperPairs(),
                        'MemberExpression.object',
                    ),
                    property: visitNode(
                        target.property,
                        originalSource,
                        memberExpressionIdentifierPairs(),
                        'MemberExpression.property',
                    ),
                },
                span,
            );
        }
        return new MemberExpressionTypeClass(
            {
                computed: false,
                object: visitNode(
                    target.object,
                    originalSource,
                    expressionVisitorEvaluatePairs(),
                    'MemberExpression.object',
                ),
                property: visitNode(
                    target.property,
                    originalSource,
                    memberExpressionStaticPropertyPairs(),
                    'MemberExpression.property',
                ),
            },
            span,
        );
    }

    getObject(): MemberExpressionFields['object'] {
        return this.getFields().object;
    }

    getProperty(): MemberExpressionFields['property'] {
        return this.getFields().property;
    }

    getComputed(): MemberExpressionFields['computed'] {
        return this.getFields().computed;
    }
}

export const memberExpressionTypePair: EvaluatePair<MemberExpression, MemberExpressionTypeClass> =
    makeEvaluatePair(isMemberExpression, (target, originalSource) =>
        MemberExpressionTypeClass.create(target, originalSource),
    );

export const isMemberExpressionType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is MemberExpressionTypeClass => target instanceof MemberExpressionTypeClass;
