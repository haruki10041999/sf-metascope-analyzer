import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isTSInterfaceHeritage, type TSInterfaceHeritage } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    visitNode,
    getSourceSpan,
} from '../commonVisitor';
import { expressionVisitorEvaluatePairs, type ExpressionTypeClass } from '../expressionVisitor';
import { TSTypeParameterInstantiationTypeClass } from '../typeScriptVisitor/tSTypeParameterInstantiation';

export type TSInterfaceHeritageFields = TypeField<'tSInterfaceHeritage'> & {
    expression: ExpressionTypeClass;
    typeArguments: TSTypeParameterInstantiationTypeClass | null;
};

export class TSInterfaceHeritageTypeClass extends LwcCommonTypeClass<
    'tSInterfaceHeritage',
    TSInterfaceHeritageFields
> {
    private constructor(value: FieldsOf<TSInterfaceHeritageFields>, sourceSpan: SourceSpan) {
        super('tSInterfaceHeritage', value, sourceSpan);
    }

    static create(
        target: TSInterfaceHeritage,
        originalSource: string,
    ): TSInterfaceHeritageTypeClass {
        return new TSInterfaceHeritageTypeClass(
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

    getExpression(): TSInterfaceHeritageFields['expression'] {
        return this.getFields().expression;
    }

    getTypeArguments(): TSInterfaceHeritageFields['typeArguments'] {
        return this.getFields().typeArguments;
    }
}

export const tSInterfaceHeritageTypePair: EvaluatePair<
    TSInterfaceHeritage,
    TSInterfaceHeritageTypeClass
> = makeEvaluatePair(isTSInterfaceHeritage, (target, originalSource) =>
    TSInterfaceHeritageTypeClass.create(target, originalSource),
);

export const isTSInterfaceHeritageType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is TSInterfaceHeritageTypeClass => target instanceof TSInterfaceHeritageTypeClass;
