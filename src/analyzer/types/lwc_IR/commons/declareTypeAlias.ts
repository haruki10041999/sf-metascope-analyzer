import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isDeclareTypeAlias, type DeclareTypeAlias } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    visitNode,
    getSourceSpan,
} from '../commonVisitor';
import { flowTypeVisitorEvaluatePairs, type FlowTypeTypeClass } from '../flowTypeVisitor';
import { TypeParameterDeclarationTypeClass } from '../flowVisitor/typeParameterDeclaration';
import { IdentifierTypeClass } from './identifier';

export type DeclareTypeAliasFields = TypeField<'declareTypeAlias'> & {
    id: IdentifierTypeClass;
    typeParameters: TypeParameterDeclarationTypeClass | null;
    right: FlowTypeTypeClass;
};

export class DeclareTypeAliasTypeClass extends LwcCommonTypeClass<
    'declareTypeAlias',
    DeclareTypeAliasFields
> {
    private constructor(value: FieldsOf<DeclareTypeAliasFields>, sourceSpan: SourceSpan) {
        super('declareTypeAlias', value, sourceSpan);
    }

    static create(target: DeclareTypeAlias, originalSource: string): DeclareTypeAliasTypeClass {
        return new DeclareTypeAliasTypeClass(
            {
                id: IdentifierTypeClass.create(target.id, originalSource),
                typeParameters:
                    target.typeParameters == null
                        ? null
                        : TypeParameterDeclarationTypeClass.create(
                              target.typeParameters,
                              originalSource,
                          ),
                right: visitNode(
                    target.right,
                    originalSource,
                    flowTypeVisitorEvaluatePairs(),
                    'FlowTypeVisitor',
                ),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getId(): DeclareTypeAliasFields['id'] {
        return this.getFields().id;
    }

    getTypeParameters(): DeclareTypeAliasFields['typeParameters'] {
        return this.getFields().typeParameters;
    }

    getRight(): DeclareTypeAliasFields['right'] {
        return this.getFields().right;
    }
}

export const declareTypeAliasTypePair: EvaluatePair<DeclareTypeAlias, DeclareTypeAliasTypeClass> =
    makeEvaluatePair(isDeclareTypeAlias, (target, originalSource) =>
        DeclareTypeAliasTypeClass.create(target, originalSource),
    );

export const isDeclareTypeAliasType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is DeclareTypeAliasTypeClass => target instanceof DeclareTypeAliasTypeClass;
