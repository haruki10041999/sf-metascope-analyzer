import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isNewExpression, type NewExpression } from '@babel/types';
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

export type NewExpressionFields = TypeField<'newExpression'> & {
    callee: ExpressionTypeClass | V8IntrinsicIdentifierTypeClass;
    arguments: (ExpressionTypeClass | SpreadElementTypeClass | ArgumentPlaceholderTypeClass)[];
    typeArguments:
        TypeParameterInstantiationTypeClass | TSTypeParameterInstantiationTypeClass | null;
};

export class NewExpressionTypeClass extends LwcCommonTypeClass<
    'newExpression',
    NewExpressionFields
> {
    private constructor(value: FieldsOf<NewExpressionFields>, sourceSpan: SourceSpan) {
        super('newExpression', value, sourceSpan);
    }

    static create(target: NewExpression, originalSource: string): NewExpressionTypeClass {
        return new NewExpressionTypeClass(
            {
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
            },
            getSourceSpan(target, originalSource),
        );
    }

    getCallee(): NewExpressionFields['callee'] {
        return this.getFields().callee;
    }

    getArguments(): NewExpressionFields['arguments'] {
        return this.getFields().arguments;
    }

    getTypeArguments(): NewExpressionFields['typeArguments'] {
        return this.getFields().typeArguments;
    }
}

export const newExpressionTypePair: EvaluatePair<NewExpression, NewExpressionTypeClass> =
    makeEvaluatePair(isNewExpression, (target, originalSource) =>
        NewExpressionTypeClass.create(target, originalSource),
    );

export const isNewExpressionType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is NewExpressionTypeClass => target instanceof NewExpressionTypeClass;
