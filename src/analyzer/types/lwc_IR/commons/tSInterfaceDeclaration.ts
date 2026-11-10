import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isTSInterfaceDeclaration, type TSInterfaceDeclaration } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    getSourceSpan,
} from '../commonVisitor';
import { TSInterfaceBodyTypeClass } from '../typeScriptVisitor/tSInterfaceBody';
import { TSTypeParameterDeclarationTypeClass } from '../typeScriptVisitor/tSTypeParameterDeclaration';
import { IdentifierTypeClass } from './identifier';
import { TSInterfaceHeritageTypeClass } from './tSInterfaceHeritage';

export type TSInterfaceDeclarationFields = TypeField<'tSInterfaceDeclaration'> & {
    declare: boolean;
    id: IdentifierTypeClass;
    typeParameters: TSTypeParameterDeclarationTypeClass | null;
    extends: TSInterfaceHeritageTypeClass[] | null;
    body: TSInterfaceBodyTypeClass;
};

export class TSInterfaceDeclarationTypeClass extends LwcCommonTypeClass<
    'tSInterfaceDeclaration',
    TSInterfaceDeclarationFields
> {
    private constructor(value: FieldsOf<TSInterfaceDeclarationFields>, sourceSpan: SourceSpan) {
        super('tSInterfaceDeclaration', value, sourceSpan);
    }

    static create(
        target: TSInterfaceDeclaration,
        originalSource: string,
    ): TSInterfaceDeclarationTypeClass {
        return new TSInterfaceDeclarationTypeClass(
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
                extends:
                    target.extends == null
                        ? null
                        : target.extends.map((child) =>
                              TSInterfaceHeritageTypeClass.create(child, originalSource),
                          ),
                body: TSInterfaceBodyTypeClass.create(target.body, originalSource),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getDeclare(): TSInterfaceDeclarationFields['declare'] {
        return this.getFields().declare;
    }

    getId(): TSInterfaceDeclarationFields['id'] {
        return this.getFields().id;
    }

    getTypeParameters(): TSInterfaceDeclarationFields['typeParameters'] {
        return this.getFields().typeParameters;
    }

    getExtends(): TSInterfaceDeclarationFields['extends'] {
        return this.getFields().extends;
    }

    getBody(): TSInterfaceDeclarationFields['body'] {
        return this.getFields().body;
    }
}

export const tSInterfaceDeclarationTypePair: EvaluatePair<
    TSInterfaceDeclaration,
    TSInterfaceDeclarationTypeClass
> = makeEvaluatePair(isTSInterfaceDeclaration, (target, originalSource) =>
    TSInterfaceDeclarationTypeClass.create(target, originalSource),
);

export const isTSInterfaceDeclarationType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is TSInterfaceDeclarationTypeClass => target instanceof TSInterfaceDeclarationTypeClass;
