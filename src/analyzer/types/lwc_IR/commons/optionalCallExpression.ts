import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isOptionalCallExpression, type OptionalCallExpression } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNode,
    visitNodeList,
    visitOptionalNode,
    getSourceSpan,
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

export type OptionalCallExpressionFields = TypeField<'optionalCallExpression'> & {
    callee: ExpressionTypeClass;
    arguments: (ExpressionTypeClass | SpreadElementTypeClass | ArgumentPlaceholderTypeClass)[];
    optional: OptionalCallExpression['optional'];
    typeArguments:
        TypeParameterInstantiationTypeClass | TSTypeParameterInstantiationTypeClass | null;
};

export class OptionalCallExpressionTypeClass extends LwcCommonTypeClass<
    'optionalCallExpression',
    OptionalCallExpressionFields
> {
    private constructor(value: FieldsOf<OptionalCallExpressionFields>, sourceSpan: SourceSpan) {
        super('optionalCallExpression', value, sourceSpan);
    }

    static create(
        target: OptionalCallExpression,
        originalSource: string,
    ): OptionalCallExpressionTypeClass {
        return new OptionalCallExpressionTypeClass(
            {
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
            },
            getSourceSpan(target, originalSource),
        );
    }

    getCallee(): OptionalCallExpressionFields['callee'] {
        return this.getFields().callee;
    }

    getArguments(): OptionalCallExpressionFields['arguments'] {
        return this.getFields().arguments;
    }

    getOptional(): OptionalCallExpressionFields['optional'] {
        return this.getFields().optional;
    }

    getTypeArguments(): OptionalCallExpressionFields['typeArguments'] {
        return this.getFields().typeArguments;
    }
}

export const optionalCallExpressionTypePair: EvaluatePair<
    OptionalCallExpression,
    OptionalCallExpressionTypeClass
> = makeEvaluatePair(isOptionalCallExpression, (target, originalSource) =>
    OptionalCallExpressionTypeClass.create(target, originalSource),
);

export const isOptionalCallExpressionType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is OptionalCallExpressionTypeClass => target instanceof OptionalCallExpressionTypeClass;
