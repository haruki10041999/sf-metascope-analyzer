import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isOptionalMemberExpression, type OptionalMemberExpression } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNode,
    getSourceSpan,
} from '../commonVisitor';
import { expressionVisitorEvaluatePairs, type ExpressionTypeClass } from '../expressionVisitor';
import { identifierTypePair, type IdentifierTypeClass } from './identifier';
import { privateNameTypePair, type PrivateNameTypeClass } from './privateName';

const optionalMemberExpressionStaticPropertyPairs = lazyPairs(
    () => [identifierTypePair, privateNameTypePair] as const,
);

/**
 * Babel 8 の OptionalMemberExpressionComputed | OptionalMemberExpressionNonComputed。
 * computed: false の property は Identifier・PrivateName (object は式だけ。`super?.x` は書けない)
 */
export type OptionalMemberExpressionFields = TypeField<'optionalMemberExpression'> & {
    object: ExpressionTypeClass;
    optional: OptionalMemberExpression['optional'];
} & (
        | { computed: false; property: IdentifierTypeClass | PrivateNameTypeClass }
        | { computed: true; property: ExpressionTypeClass }
    );

export class OptionalMemberExpressionTypeClass extends LwcCommonTypeClass<
    'optionalMemberExpression',
    OptionalMemberExpressionFields
> {
    private constructor(value: FieldsOf<OptionalMemberExpressionFields>, sourceSpan: SourceSpan) {
        super('optionalMemberExpression', value, sourceSpan);
    }

    static create(
        target: OptionalMemberExpression,
        originalSource: string,
    ): OptionalMemberExpressionTypeClass {
        const common = {
            object: visitNode(
                target.object,
                originalSource,
                expressionVisitorEvaluatePairs(),
                'OptionalMemberExpression.object',
            ),
            optional: target.optional,
        };
        return new OptionalMemberExpressionTypeClass(
            target.computed
                ? {
                      ...common,
                      computed: true,
                      property: visitNode(
                          target.property,
                          originalSource,
                          expressionVisitorEvaluatePairs(),
                          'OptionalMemberExpression.property',
                      ),
                  }
                : {
                      ...common,
                      computed: false,
                      property: visitNode(
                          target.property,
                          originalSource,
                          optionalMemberExpressionStaticPropertyPairs(),
                          'OptionalMemberExpression.property',
                      ),
                  },
            getSourceSpan(target, originalSource),
        );
    }

    getObject(): OptionalMemberExpressionFields['object'] {
        return this.getFields().object;
    }

    getProperty(): OptionalMemberExpressionFields['property'] {
        return this.getFields().property;
    }

    getComputed(): OptionalMemberExpressionFields['computed'] {
        return this.getFields().computed;
    }

    getOptional(): OptionalMemberExpressionFields['optional'] {
        return this.getFields().optional;
    }
}

export const optionalMemberExpressionTypePair: EvaluatePair<
    OptionalMemberExpression,
    OptionalMemberExpressionTypeClass
> = makeEvaluatePair(isOptionalMemberExpression, (target, originalSource) =>
    OptionalMemberExpressionTypeClass.create(target, originalSource),
);

export const isOptionalMemberExpressionType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is OptionalMemberExpressionTypeClass =>
    target instanceof OptionalMemberExpressionTypeClass;
