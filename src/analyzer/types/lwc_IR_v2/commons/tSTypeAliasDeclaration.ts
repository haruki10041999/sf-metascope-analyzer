import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isTSTypeAliasDeclaration, type TSTypeAliasDeclaration } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    visitNode,
    getSourceSpan,
} from '../commonVisitor';
import { tSTypeVisitorEvaluatePairs, type TSTypeTypeClass } from '../tsTypeVisitor';
import { TSTypeParameterDeclarationTypeClass } from '../typeScriptVisitor/tSTypeParameterDeclaration';
import { IdentifierTypeClass } from './identifier';

export type TSTypeAliasDeclarationFields = TypeField<'tSTypeAliasDeclaration'> & {
    declare: boolean;
    id: IdentifierTypeClass;
    typeParameters: TSTypeParameterDeclarationTypeClass | null;
    typeAnnotation: TSTypeTypeClass;
};

export class TSTypeAliasDeclarationTypeClass extends LwcCommonTypeClass<
    'tSTypeAliasDeclaration',
    TSTypeAliasDeclarationFields
> {
    private constructor(value: FieldsOf<TSTypeAliasDeclarationFields>, sourceSpan: SourceSpan) {
        super('tSTypeAliasDeclaration', value, sourceSpan);
    }

    static create(
        target: TSTypeAliasDeclaration,
        originalSource: string,
    ): TSTypeAliasDeclarationTypeClass {
        return new TSTypeAliasDeclarationTypeClass(
            {
                declare: target.declare ?? false,
                id: IdentifierTypeClass.create(target.id, originalSource),
                typeParameters:
                    target.typeParameters == null
                        ? null
                        : TSTypeParameterDeclarationTypeClass.create(
                              target.typeParameters,
                              originalSource,
                          ),
                typeAnnotation: visitNode(
                    target.typeAnnotation,
                    originalSource,
                    tSTypeVisitorEvaluatePairs(),
                    'TSTypeVisitor',
                ),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getDeclare(): TSTypeAliasDeclarationFields['declare'] {
        return this.getFields().declare;
    }

    getId(): TSTypeAliasDeclarationFields['id'] {
        return this.getFields().id;
    }

    getTypeParameters(): TSTypeAliasDeclarationFields['typeParameters'] {
        return this.getFields().typeParameters;
    }

    getTypeAnnotation(): TSTypeAliasDeclarationFields['typeAnnotation'] {
        return this.getFields().typeAnnotation;
    }
}

export const tSTypeAliasDeclarationTypePair: EvaluatePair<
    TSTypeAliasDeclaration,
    TSTypeAliasDeclarationTypeClass
> = makeEvaluatePair(isTSTypeAliasDeclaration, (target, originalSource) =>
    TSTypeAliasDeclarationTypeClass.create(target, originalSource),
);

export const isTSTypeAliasDeclarationType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is TSTypeAliasDeclarationTypeClass => target instanceof TSTypeAliasDeclarationTypeClass;
