import { isImportNamespaceSpecifier, type ImportNamespaceSpecifier } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNode,
} from '../commonVisitor';
import { identifierTypePair, type IdentifierTypeClass } from './identifier';

const importNamespaceSpecifierLocalPairs = lazyPairs(() => [identifierTypePair] as const);

export type ImportNamespaceSpecifierFields = {
    local: IdentifierTypeClass | LwcErrorTypeClass;
};

export class ImportNamespaceSpecifierTypeClass extends LwcCommonTypeClass<'importNamespaceSpecifier'> {
    private readonly value: ImportNamespaceSpecifierFields;

    private constructor(value: ImportNamespaceSpecifierFields) {
        super('importNamespaceSpecifier');
        this.value = value;
    }

    static create(
        target: ImportNamespaceSpecifier,
        originalSource: string,
    ): ImportNamespaceSpecifierTypeClass {
        return new ImportNamespaceSpecifierTypeClass({
            local: visitNode(
                target.local,
                originalSource,
                importNamespaceSpecifierLocalPairs(),
                'ImportNamespaceSpecifier.local',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): ImportNamespaceSpecifierFields {
        return this.value;
    }

    getLocal(): ImportNamespaceSpecifierFields['local'] {
        return this.value.local;
    }
}

export const importNamespaceSpecifierTypePair: EvaluatePair<
    ImportNamespaceSpecifier,
    ImportNamespaceSpecifierTypeClass
> = makeEvaluatePair(isImportNamespaceSpecifier, (target, originalSource) =>
    ImportNamespaceSpecifierTypeClass.create(target, originalSource),
);

export const isImportNamespaceSpecifierType = (
    target: LwcCommonTypeClass<string>,
): target is ImportNamespaceSpecifierTypeClass =>
    target instanceof ImportNamespaceSpecifierTypeClass;
