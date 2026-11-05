import { isTSNamespaceExportDeclaration, type TSNamespaceExportDeclaration } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNode,
} from '../commonVisitor';
import { identifierTypePair, type IdentifierTypeClass } from './identifier';

const tSNamespaceExportDeclarationIdPairs = lazyPairs(() => [identifierTypePair] as const);

export type TSNamespaceExportDeclarationFields = {
    id: IdentifierTypeClass | LwcErrorTypeClass;
};

export class TSNamespaceExportDeclarationTypeClass extends LwcCommonTypeClass<'tSNamespaceExportDeclaration'> {
    private readonly value: TSNamespaceExportDeclarationFields;

    private constructor(value: TSNamespaceExportDeclarationFields) {
        super('tSNamespaceExportDeclaration');
        this.value = value;
    }

    static create(
        target: TSNamespaceExportDeclaration,
        originalSource: string,
    ): TSNamespaceExportDeclarationTypeClass {
        return new TSNamespaceExportDeclarationTypeClass({
            id: visitNode(
                target.id,
                originalSource,
                tSNamespaceExportDeclarationIdPairs(),
                'TSNamespaceExportDeclaration.id',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): TSNamespaceExportDeclarationFields {
        return this.value;
    }

    getId(): TSNamespaceExportDeclarationFields['id'] {
        return this.value.id;
    }
}

export const tSNamespaceExportDeclarationTypePair: EvaluatePair<
    TSNamespaceExportDeclaration,
    TSNamespaceExportDeclarationTypeClass
> = makeEvaluatePair(isTSNamespaceExportDeclaration, (target, originalSource) =>
    TSNamespaceExportDeclarationTypeClass.create(target, originalSource),
);

export const isTSNamespaceExportDeclarationType = (
    target: LwcCommonTypeClass<string>,
): target is TSNamespaceExportDeclarationTypeClass =>
    target instanceof TSNamespaceExportDeclarationTypeClass;
