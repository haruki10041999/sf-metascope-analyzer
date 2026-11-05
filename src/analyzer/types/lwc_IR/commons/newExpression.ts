import { isNewExpression, type NewExpression } from '@babel/types';
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
    v8IntrinsicIdentifierTypePair,
    type V8IntrinsicIdentifierTypeClass,
} from '../miscellaneousVisitor/v8IntrinsicIdentifier';
import {
    tSTypeParameterInstantiationTypePair,
    type TSTypeParameterInstantiationTypeClass,
} from '../typeScriptVisitor/tSTypeParameterInstantiation';
import {
    argumentPlaceholderTypePair,
    type ArgumentPlaceholderTypeClass,
} from './argumentPlaceholder';
import { spreadElementTypePair, type SpreadElementTypeClass } from './spreadElement';

const newExpressionCalleePairs = lazyPairs(
    () => [...expressionVisitorEvaluatePairs(), v8IntrinsicIdentifierTypePair] as const,
);
const newExpressionArgumentsPairs = lazyPairs(
    () =>
        [
            ...expressionVisitorEvaluatePairs(),
            spreadElementTypePair,
            argumentPlaceholderTypePair,
        ] as const,
);
const newExpressionTypeArgumentsPairs = lazyPairs(
    () => [typeParameterInstantiationTypePair, tSTypeParameterInstantiationTypePair] as const,
);

export type NewExpressionFields = {
    callee: ExpressionTypeClass | V8IntrinsicIdentifierTypeClass | LwcErrorTypeClass;
    arguments: (
        | ExpressionTypeClass
        | SpreadElementTypeClass
        | ArgumentPlaceholderTypeClass
        | LwcErrorTypeClass
    )[];
    typeArguments:
        | TypeParameterInstantiationTypeClass
        | TSTypeParameterInstantiationTypeClass
        | LwcErrorTypeClass
        | null;
};

export class NewExpressionTypeClass extends LwcCommonTypeClass<'newExpression'> {
    private readonly value: NewExpressionFields;

    private constructor(value: NewExpressionFields) {
        super('newExpression');
        this.value = value;
    }

    static create(target: NewExpression, originalSource: string): NewExpressionTypeClass {
        return new NewExpressionTypeClass({
            callee: visitNode(
                target.callee,
                originalSource,
                newExpressionCalleePairs(),
                'NewExpression.callee',
            ),
            arguments: visitNodeList(
                target.arguments,
                originalSource,
                newExpressionArgumentsPairs(),
                'NewExpression.arguments',
            ),
            typeArguments: visitOptionalNode(
                target.typeArguments,
                originalSource,
                newExpressionTypeArgumentsPairs(),
                'NewExpression.typeArguments',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): NewExpressionFields {
        return this.value;
    }

    getCallee(): NewExpressionFields['callee'] {
        return this.value.callee;
    }

    getArguments(): NewExpressionFields['arguments'] {
        return this.value.arguments;
    }

    getTypeArguments(): NewExpressionFields['typeArguments'] {
        return this.value.typeArguments;
    }
}

export const newExpressionTypePair: EvaluatePair<NewExpression, NewExpressionTypeClass> =
    makeEvaluatePair(isNewExpression, (target, originalSource) =>
        NewExpressionTypeClass.create(target, originalSource),
    );

export const isNewExpressionType = (
    target: LwcCommonTypeClass<string>,
): target is NewExpressionTypeClass => target instanceof NewExpressionTypeClass;
