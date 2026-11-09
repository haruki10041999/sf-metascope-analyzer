import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isEnumDeclaration, type EnumDeclaration } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNode,
    getSourceSpan,
} from '../commonVisitor';
import { enumBooleanBodyTypePair, type EnumBooleanBodyTypeClass } from './enumBooleanBody';
import { enumNumberBodyTypePair, type EnumNumberBodyTypeClass } from './enumNumberBody';
import { enumStringBodyTypePair, type EnumStringBodyTypeClass } from './enumStringBody';
import { enumSymbolBodyTypePair, type EnumSymbolBodyTypeClass } from './enumSymbolBody';
import { IdentifierTypeClass } from './identifier';

const enumDeclarationBodyPairs = lazyPairs(
    () =>
        [
            enumBooleanBodyTypePair,
            enumNumberBodyTypePair,
            enumStringBodyTypePair,
            enumSymbolBodyTypePair,
        ] as const,
);

export type EnumDeclarationFields = TypeField<'enumDeclaration'> & {
    id: IdentifierTypeClass;
    body:
        | EnumBooleanBodyTypeClass
        | EnumNumberBodyTypeClass
        | EnumStringBodyTypeClass
        | EnumSymbolBodyTypeClass;
};

export class EnumDeclarationTypeClass extends LwcCommonTypeClass<
    'enumDeclaration',
    EnumDeclarationFields
> {
    private constructor(value: FieldsOf<EnumDeclarationFields>, sourceSpan: SourceSpan) {
        super('enumDeclaration', value, sourceSpan);
    }

    static create(target: EnumDeclaration, originalSource: string): EnumDeclarationTypeClass {
        return new EnumDeclarationTypeClass(
            {
                id: IdentifierTypeClass.create(target.id, originalSource),
                body: visitNode(
                    target.body,
                    originalSource,
                    enumDeclarationBodyPairs(),
                    'EnumDeclaration.body',
                ),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getId(): EnumDeclarationFields['id'] {
        return this.getFields().id;
    }

    getBody(): EnumDeclarationFields['body'] {
        return this.getFields().body;
    }
}

export const enumDeclarationTypePair: EvaluatePair<EnumDeclaration, EnumDeclarationTypeClass> =
    makeEvaluatePair(isEnumDeclaration, (target, originalSource) =>
        EnumDeclarationTypeClass.create(target, originalSource),
    );

export const isEnumDeclarationType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is EnumDeclarationTypeClass => target instanceof EnumDeclarationTypeClass;
