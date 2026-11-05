import { isTSInterfaceHeritage, type TSInterfaceHeritage } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNode,
    visitOptionalNode,
} from '../commonVisitor';
import { expressionVisitorEvaluatePairs, type ExpressionTypeClass } from '../expressionVisitor';
import {
    tSTypeParameterInstantiationTypePair,
    type TSTypeParameterInstantiationTypeClass,
} from '../typeScriptVisitor/tSTypeParameterInstantiation';

const tSInterfaceHeritageTypeArgumentsPairs = lazyPairs(
    () => [tSTypeParameterInstantiationTypePair] as const,
);

export type TSInterfaceHeritageFields = {
    expression: ExpressionTypeClass | LwcErrorTypeClass;
    typeArguments: TSTypeParameterInstantiationTypeClass | LwcErrorTypeClass | null;
};

export class TSInterfaceHeritageTypeClass extends LwcCommonTypeClass<'tSInterfaceHeritage'> {
    private readonly value: TSInterfaceHeritageFields;

    private constructor(value: TSInterfaceHeritageFields) {
        super('tSInterfaceHeritage');
        this.value = value;
    }

    static create(
        target: TSInterfaceHeritage,
        originalSource: string,
    ): TSInterfaceHeritageTypeClass {
        return new TSInterfaceHeritageTypeClass({
            expression: visitNode(
                target.expression,
                originalSource,
                expressionVisitorEvaluatePairs(),
                'ExpressionVisitor',
            ),
            typeArguments: visitOptionalNode(
                target.typeArguments,
                originalSource,
                tSInterfaceHeritageTypeArgumentsPairs(),
                'TSInterfaceHeritage.typeArguments',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): TSInterfaceHeritageFields {
        return this.value;
    }

    getExpression(): TSInterfaceHeritageFields['expression'] {
        return this.value.expression;
    }

    getTypeArguments(): TSInterfaceHeritageFields['typeArguments'] {
        return this.value.typeArguments;
    }
}

export const tSInterfaceHeritageTypePair: EvaluatePair<
    TSInterfaceHeritage,
    TSInterfaceHeritageTypeClass
> = makeEvaluatePair(isTSInterfaceHeritage, (target, originalSource) =>
    TSInterfaceHeritageTypeClass.create(target, originalSource),
);

export const isTSInterfaceHeritageType = (
    target: LwcCommonTypeClass<string>,
): target is TSInterfaceHeritageTypeClass => target instanceof TSInterfaceHeritageTypeClass;
