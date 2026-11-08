import { isOptionalMemberExpression, type OptionalMemberExpression } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNode,
} from '../commonVisitor';
import { expressionVisitorEvaluatePairs, type ExpressionTypeClass } from '../expressionVisitor';
import { privateNameTypePair, type PrivateNameTypeClass } from './privateName';

const optionalMemberExpressionPropertyPairs = lazyPairs(
    () => [...expressionVisitorEvaluatePairs(), privateNameTypePair] as const,
);

export type OptionalMemberExpressionFields = {
    object: ExpressionTypeClass | LwcErrorTypeClass;
    property: ExpressionTypeClass | PrivateNameTypeClass | LwcErrorTypeClass;
    computed: OptionalMemberExpression['computed'];
    optional: OptionalMemberExpression['optional'];
};

export class OptionalMemberExpressionTypeClass extends LwcCommonTypeClass<'optionalMemberExpression'> {
    private readonly value: OptionalMemberExpressionFields;

    private constructor(value: OptionalMemberExpressionFields) {
        super('optionalMemberExpression');
        this.value = value;
    }

    static create(
        target: OptionalMemberExpression,
        originalSource: string,
    ): OptionalMemberExpressionTypeClass {
        return new OptionalMemberExpressionTypeClass({
            object: visitNode(
                target.object,
                originalSource,
                expressionVisitorEvaluatePairs(),
                'ExpressionVisitor',
            ),
            property: visitNode(
                target.property,
                originalSource,
                optionalMemberExpressionPropertyPairs(),
                'OptionalMemberExpression.property',
            ),
            computed: target.computed,
            optional: target.optional,
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): OptionalMemberExpressionFields {
        return this.value;
    }

    getObject(): OptionalMemberExpressionFields['object'] {
        return this.value.object;
    }

    getProperty(): OptionalMemberExpressionFields['property'] {
        return this.value.property;
    }

    getComputed(): OptionalMemberExpressionFields['computed'] {
        return this.value.computed;
    }

    getOptional(): OptionalMemberExpressionFields['optional'] {
        return this.value.optional;
    }
}

export const optionalMemberExpressionTypePair: EvaluatePair<
    OptionalMemberExpression,
    OptionalMemberExpressionTypeClass
> = makeEvaluatePair(isOptionalMemberExpression, (target, originalSource) =>
    OptionalMemberExpressionTypeClass.create(target, originalSource),
);

export const isOptionalMemberExpressionType = (
    target: LwcCommonTypeClass<string>,
): target is OptionalMemberExpressionTypeClass =>
    target instanceof OptionalMemberExpressionTypeClass;
