import { isImportDefaultSpecifier, type ImportDefaultSpecifier } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNode,
} from '../commonVisitor';
import { identifierTypePair, type IdentifierTypeClass } from './identifier';

const importDefaultSpecifierLocalPairs = lazyPairs(() => [identifierTypePair] as const);

export type ImportDefaultSpecifierFields = {
    local: IdentifierTypeClass | LwcErrorTypeClass;
};

export class ImportDefaultSpecifierTypeClass extends LwcCommonTypeClass<'importDefaultSpecifier'> {
    private readonly value: ImportDefaultSpecifierFields;

    private constructor(value: ImportDefaultSpecifierFields) {
        super('importDefaultSpecifier');
        this.value = value;
    }

    static create(
        target: ImportDefaultSpecifier,
        originalSource: string,
    ): ImportDefaultSpecifierTypeClass {
        return new ImportDefaultSpecifierTypeClass({
            local: visitNode(
                target.local,
                originalSource,
                importDefaultSpecifierLocalPairs(),
                'ImportDefaultSpecifier.local',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): ImportDefaultSpecifierFields {
        return this.value;
    }

    getLocal(): ImportDefaultSpecifierFields['local'] {
        return this.value.local;
    }
}

export const importDefaultSpecifierTypePair: EvaluatePair<
    ImportDefaultSpecifier,
    ImportDefaultSpecifierTypeClass
> = makeEvaluatePair(isImportDefaultSpecifier, (target, originalSource) =>
    ImportDefaultSpecifierTypeClass.create(target, originalSource),
);

export const isImportDefaultSpecifierType = (
    target: LwcCommonTypeClass<string>,
): target is ImportDefaultSpecifierTypeClass => target instanceof ImportDefaultSpecifierTypeClass;
