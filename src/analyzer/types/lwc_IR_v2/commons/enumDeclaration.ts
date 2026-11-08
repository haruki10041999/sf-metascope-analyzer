import { isEnumDeclaration, type EnumDeclaration } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNode,
} from '../commonVisitor';
import { enumBooleanBodyTypePair, type EnumBooleanBodyTypeClass } from './enumBooleanBody';
import { enumNumberBodyTypePair, type EnumNumberBodyTypeClass } from './enumNumberBody';
import { enumStringBodyTypePair, type EnumStringBodyTypeClass } from './enumStringBody';
import { enumSymbolBodyTypePair, type EnumSymbolBodyTypeClass } from './enumSymbolBody';
import { identifierTypePair, type IdentifierTypeClass } from './identifier';

const enumDeclarationIdPairs = lazyPairs(() => [identifierTypePair] as const);
const enumDeclarationBodyPairs = lazyPairs(
    () =>
        [
            enumBooleanBodyTypePair,
            enumNumberBodyTypePair,
            enumStringBodyTypePair,
            enumSymbolBodyTypePair,
        ] as const,
);

export type EnumDeclarationFields = {
    id: IdentifierTypeClass | LwcErrorTypeClass;
    body:
        | EnumBooleanBodyTypeClass
        | EnumNumberBodyTypeClass
        | EnumStringBodyTypeClass
        | EnumSymbolBodyTypeClass
        | LwcErrorTypeClass;
};

export class EnumDeclarationTypeClass extends LwcCommonTypeClass<'enumDeclaration'> {
    private readonly value: EnumDeclarationFields;

    private constructor(value: EnumDeclarationFields) {
        super('enumDeclaration');
        this.value = value;
    }

    static create(target: EnumDeclaration, originalSource: string): EnumDeclarationTypeClass {
        return new EnumDeclarationTypeClass({
            id: visitNode(
                target.id,
                originalSource,
                enumDeclarationIdPairs(),
                'EnumDeclaration.id',
            ),
            body: visitNode(
                target.body,
                originalSource,
                enumDeclarationBodyPairs(),
                'EnumDeclaration.body',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): EnumDeclarationFields {
        return this.value;
    }

    getId(): EnumDeclarationFields['id'] {
        return this.value.id;
    }

    getBody(): EnumDeclarationFields['body'] {
        return this.value.body;
    }
}

export const enumDeclarationTypePair: EvaluatePair<EnumDeclaration, EnumDeclarationTypeClass> =
    makeEvaluatePair(isEnumDeclaration, (target, originalSource) =>
        EnumDeclarationTypeClass.create(target, originalSource),
    );

export const isEnumDeclarationType = (
    target: LwcCommonTypeClass<string>,
): target is EnumDeclarationTypeClass => target instanceof EnumDeclarationTypeClass;
