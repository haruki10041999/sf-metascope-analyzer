import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isTSTypeReference, type TSTypeReference } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    visitNode,
    getSourceSpan,
} from '../commonVisitor';
import {
    tSEntityNameVisitorEvaluatePairs,
    type TSEntityNameTypeClass,
} from '../tsEntityNameVisitor';
import { TSTypeParameterInstantiationTypeClass } from '../typeScriptVisitor/tSTypeParameterInstantiation';

export type TSTypeReferenceFields = TypeField<'tSTypeReference'> & {
    typeName: TSEntityNameTypeClass;
    typeArguments: TSTypeParameterInstantiationTypeClass | null;
};

export class TSTypeReferenceTypeClass extends LwcCommonTypeClass<
    'tSTypeReference',
    TSTypeReferenceFields
> {
    private constructor(value: FieldsOf<TSTypeReferenceFields>, sourceSpan: SourceSpan) {
        super('tSTypeReference', value, sourceSpan);
    }

    static create(target: TSTypeReference, originalSource: string): TSTypeReferenceTypeClass {
        return new TSTypeReferenceTypeClass(
            {
                typeName: visitNode(
                    target.typeName,
                    originalSource,
                    tSEntityNameVisitorEvaluatePairs(),
                    'TSEntityNameVisitor',
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

    getTypeName(): TSTypeReferenceFields['typeName'] {
        return this.getFields().typeName;
    }

    getTypeArguments(): TSTypeReferenceFields['typeArguments'] {
        return this.getFields().typeArguments;
    }
}

export const tSTypeReferenceTypePair: EvaluatePair<TSTypeReference, TSTypeReferenceTypeClass> =
    makeEvaluatePair(isTSTypeReference, (target, originalSource) =>
        TSTypeReferenceTypeClass.create(target, originalSource),
    );

export const isTSTypeReferenceType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is TSTypeReferenceTypeClass => target instanceof TSTypeReferenceTypeClass;
