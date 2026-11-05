import { isCallExpression, type CallExpression } from '@babel/types';
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
import { importTypePair, type ImportTypeClass } from '../standardizedVisitor/import';
import { superTypePair, type SuperTypeClass } from '../standardizedVisitor/super';
import {
    tSTypeParameterInstantiationTypePair,
    type TSTypeParameterInstantiationTypeClass,
} from '../typeScriptVisitor/tSTypeParameterInstantiation';
import {
    argumentPlaceholderTypePair,
    type ArgumentPlaceholderTypeClass,
} from './argumentPlaceholder';
import { spreadElementTypePair, type SpreadElementTypeClass } from './spreadElement';

const callExpressionCalleePairs = lazyPairs(
    () =>
        [
            ...expressionVisitorEvaluatePairs(),
            superTypePair,
            importTypePair,
            v8IntrinsicIdentifierTypePair,
        ] as const,
);
const callExpressionArgumentsPairs = lazyPairs(
    () =>
        [
            ...expressionVisitorEvaluatePairs(),
            spreadElementTypePair,
            argumentPlaceholderTypePair,
        ] as const,
);
const callExpressionTypeArgumentsPairs = lazyPairs(
    () => [typeParameterInstantiationTypePair, tSTypeParameterInstantiationTypePair] as const,
);

export type CallExpressionFields = {
    callee:
        | ExpressionTypeClass
        | SuperTypeClass
        | ImportTypeClass
        | V8IntrinsicIdentifierTypeClass
        | LwcErrorTypeClass;
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

export class CallExpressionTypeClass extends LwcCommonTypeClass<'callExpression'> {
    private readonly value: CallExpressionFields;

    private constructor(value: CallExpressionFields) {
        super('callExpression');
        this.value = value;
    }

    static create(target: CallExpression, originalSource: string): CallExpressionTypeClass {
        return new CallExpressionTypeClass({
            callee: visitNode(
                target.callee,
                originalSource,
                callExpressionCalleePairs(),
                'CallExpression.callee',
            ),
            arguments: visitNodeList(
                target.arguments,
                originalSource,
                callExpressionArgumentsPairs(),
                'CallExpression.arguments',
            ),
            typeArguments: visitOptionalNode(
                target.typeArguments,
                originalSource,
                callExpressionTypeArgumentsPairs(),
                'CallExpression.typeArguments',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): CallExpressionFields {
        return this.value;
    }

    getCallee(): CallExpressionFields['callee'] {
        return this.value.callee;
    }

    getArguments(): CallExpressionFields['arguments'] {
        return this.value.arguments;
    }

    getTypeArguments(): CallExpressionFields['typeArguments'] {
        return this.value.typeArguments;
    }
}

export const callExpressionTypePair: EvaluatePair<CallExpression, CallExpressionTypeClass> =
    makeEvaluatePair(isCallExpression, (target, originalSource) =>
        CallExpressionTypeClass.create(target, originalSource),
    );

export const isCallExpressionType = (
    target: LwcCommonTypeClass<string>,
): target is CallExpressionTypeClass => target instanceof CallExpressionTypeClass;
