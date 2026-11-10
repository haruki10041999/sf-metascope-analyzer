import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isTSClassImplements, type TSClassImplements } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    visitNode,
    getSourceSpan,
} from '../commonVisitor';
import { expressionVisitorEvaluatePairs, type ExpressionTypeClass } from '../expressionVisitor';
import { TSTypeParameterInstantiationTypeClass } from '../typeScriptVisitor/tSTypeParameterInstantiation';

export type TSClassImplementsFields = TypeField<'tSClassImplements'> & {
    expression: ExpressionTypeClass;
    typeArguments: TSTypeParameterInstantiationTypeClass | null;
};

export class TSClassImplementsTypeClass extends LwcCommonTypeClass<
    'tSClassImplements',
    TSClassImplementsFields
> {
    private constructor(value: FieldsOf<TSClassImplementsFields>, sourceSpan: SourceSpan) {
        super('tSClassImplements', value, sourceSpan);
    }

    static create(target: TSClassImplements, originalSource: string): TSClassImplementsTypeClass {
        return new TSClassImplementsTypeClass(
            {
                expression: visitNode(
                    target.expression,
                    originalSource,
                    expressionVisitorEvaluatePairs(),
                    'ExpressionVisitor',
                ),
                typeArguments:
                    target.typeArguments == null
                        ? null
                        : TSTypeParameterInstantiationTypeClass.create(
                              target.typeArguments,
                              originalSource,
                          ),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getExpression(): TSClassImplementsFields['expression'] {
        return this.getFields().expression;
    }

    getTypeArguments(): TSClassImplementsFields['typeArguments'] {
        return this.getFields().typeArguments;
    }
}

export const tSClassImplementsTypePair: EvaluatePair<
    TSClassImplements,
    TSClassImplementsTypeClass
> = makeEvaluatePair(isTSClassImplements, (target, originalSource) =>
    TSClassImplementsTypeClass.create(target, originalSource),
);

export const isTSClassImplementsType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is TSClassImplementsTypeClass => target instanceof TSClassImplementsTypeClass;
