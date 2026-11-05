import { isOptionalCallExpression, type OptionalCallExpression } from '@babel/types';
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
    typeParameterInstantiationTypePair,
    type TypeParameterInstantiationTypeClass,
} from '../flowVisitor/typeParameterInstantiation';
import {
    tSTypeParameterInstantiationTypePair,
    type TSTypeParameterInstantiationTypeClass,
} from '../typeScriptVisitor/tSTypeParameterInstantiation';
import {
    argumentPlaceholderTypePair,
    type ArgumentPlaceholderTypeClass,
} from './argumentPlaceholder';
import { spreadElementTypePair, type SpreadElementTypeClass } from './spreadElement';

const optionalCallExpressionArgumentsPairs = lazyPairs(
    () =>
        [
            ...expressionVisitorEvaluatePairs(),
            spreadElementTypePair,
            argumentPlaceholderTypePair,
        ] as const,
);
const optionalCallExpressionTypeArgumentsPairs = lazyPairs(
    () => [typeParameterInstantiationTypePair, tSTypeParameterInstantiationTypePair] as const,
);

export type OptionalCallExpressionFields = {
    callee: ExpressionTypeClass | LwcErrorTypeClass;
    arguments: (
        | ExpressionTypeClass
        | SpreadElementTypeClass
        | ArgumentPlaceholderTypeClass
        | LwcErrorTypeClass
    )[];
    optional: OptionalCallExpression['optional'];
    typeArguments:
        | TypeParameterInstantiationTypeClass
        | TSTypeParameterInstantiationTypeClass
        | LwcErrorTypeClass
        | null;
};

export class OptionalCallExpressionTypeClass extends LwcCommonTypeClass<'optionalCallExpression'> {
    private readonly value: OptionalCallExpressionFields;

    private constructor(value: OptionalCallExpressionFields) {
        super('optionalCallExpression');
        this.value = value;
    }

    static create(
        target: OptionalCallExpression,
        originalSource: string,
    ): OptionalCallExpressionTypeClass {
        return new OptionalCallExpressionTypeClass({
            callee: visitNode(
                target.callee,
                originalSource,
                expressionVisitorEvaluatePairs(),
                'ExpressionVisitor',
            ),
            arguments: visitNodeList(
                target.arguments,
                originalSource,
                optionalCallExpressionArgumentsPairs(),
                'OptionalCallExpression.arguments',
            ),
            optional: target.optional,
            typeArguments: visitOptionalNode(
                target.typeArguments,
                originalSource,
                optionalCallExpressionTypeArgumentsPairs(),
                'OptionalCallExpression.typeArguments',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): OptionalCallExpressionFields {
        return this.value;
    }

    getCallee(): OptionalCallExpressionFields['callee'] {
        return this.value.callee;
    }

    getArguments(): OptionalCallExpressionFields['arguments'] {
        return this.value.arguments;
    }

    getOptional(): OptionalCallExpressionFields['optional'] {
        return this.value.optional;
    }

    getTypeArguments(): OptionalCallExpressionFields['typeArguments'] {
        return this.value.typeArguments;
    }
}

export const optionalCallExpressionTypePair: EvaluatePair<
    OptionalCallExpression,
    OptionalCallExpressionTypeClass
> = makeEvaluatePair(isOptionalCallExpression, (target, originalSource) =>
    OptionalCallExpressionTypeClass.create(target, originalSource),
);

export const isOptionalCallExpressionType = (
    target: LwcCommonTypeClass<string>,
): target is OptionalCallExpressionTypeClass => target instanceof OptionalCallExpressionTypeClass;
