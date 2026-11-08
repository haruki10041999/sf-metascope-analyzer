import { isTSClassImplements, type TSClassImplements } from '@babel/types';
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

const tSClassImplementsTypeArgumentsPairs = lazyPairs(
    () => [tSTypeParameterInstantiationTypePair] as const,
);

export type TSClassImplementsFields = {
    expression: ExpressionTypeClass | LwcErrorTypeClass;
    typeArguments: TSTypeParameterInstantiationTypeClass | LwcErrorTypeClass | null;
};

export class TSClassImplementsTypeClass extends LwcCommonTypeClass<'tSClassImplements'> {
    private readonly value: TSClassImplementsFields;

    private constructor(value: TSClassImplementsFields) {
        super('tSClassImplements');
        this.value = value;
    }

    static create(target: TSClassImplements, originalSource: string): TSClassImplementsTypeClass {
        return new TSClassImplementsTypeClass({
            expression: visitNode(
                target.expression,
                originalSource,
                expressionVisitorEvaluatePairs(),
                'ExpressionVisitor',
            ),
            typeArguments: visitOptionalNode(
                target.typeArguments,
                originalSource,
                tSClassImplementsTypeArgumentsPairs(),
                'TSClassImplements.typeArguments',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): TSClassImplementsFields {
        return this.value;
    }

    getExpression(): TSClassImplementsFields['expression'] {
        return this.value.expression;
    }

    getTypeArguments(): TSClassImplementsFields['typeArguments'] {
        return this.value.typeArguments;
    }
}

export const tSClassImplementsTypePair: EvaluatePair<
    TSClassImplements,
    TSClassImplementsTypeClass
> = makeEvaluatePair(isTSClassImplements, (target, originalSource) =>
    TSClassImplementsTypeClass.create(target, originalSource),
);

export const isTSClassImplementsType = (
    target: LwcCommonTypeClass<string>,
): target is TSClassImplementsTypeClass => target instanceof TSClassImplementsTypeClass;
