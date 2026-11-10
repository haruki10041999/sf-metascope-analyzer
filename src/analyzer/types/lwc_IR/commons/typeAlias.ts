import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isTypeAlias, type TypeAlias } from '@babel/types';
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

export type TypeAliasFields = TypeField<'typeAlias'> & {
    id: IdentifierTypeClass;
    typeParameters: TypeParameterDeclarationTypeClass | null;
    right: FlowTypeTypeClass;
};

export class TypeAliasTypeClass extends LwcCommonTypeClass<'typeAlias', TypeAliasFields> {
    private constructor(value: FieldsOf<TypeAliasFields>, sourceSpan: SourceSpan) {
        super('typeAlias', value, sourceSpan);
    }

    static create(target: TypeAlias, originalSource: string): TypeAliasTypeClass {
        return new TypeAliasTypeClass(
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

    getId(): TypeAliasFields['id'] {
        return this.getFields().id;
    }

    getTypeParameters(): TypeAliasFields['typeParameters'] {
        return this.getFields().typeParameters;
    }

    getRight(): TypeAliasFields['right'] {
        return this.getFields().right;
    }
}

export const typeAliasTypePair: EvaluatePair<TypeAlias, TypeAliasTypeClass> = makeEvaluatePair(
    isTypeAlias,
    (target, originalSource) => TypeAliasTypeClass.create(target, originalSource),
);

export const isTypeAliasType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is TypeAliasTypeClass => target instanceof TypeAliasTypeClass;
