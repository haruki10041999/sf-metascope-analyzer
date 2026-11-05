import { isExportDefaultSpecifier, type ExportDefaultSpecifier } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNode,
} from '../commonVisitor';
import { identifierTypePair, type IdentifierTypeClass } from '../commons/identifier';

const exportDefaultSpecifierExportedPairs = lazyPairs(() => [identifierTypePair] as const);

export type ExportDefaultSpecifierFields = {
    exported: IdentifierTypeClass | LwcErrorTypeClass;
};

export class ExportDefaultSpecifierTypeClass extends LwcCommonTypeClass<'exportDefaultSpecifier'> {
    private readonly value: ExportDefaultSpecifierFields;

    private constructor(value: ExportDefaultSpecifierFields) {
        super('exportDefaultSpecifier');
        this.value = value;
    }

    static create(
        target: ExportDefaultSpecifier,
        originalSource: string,
    ): ExportDefaultSpecifierTypeClass {
        return new ExportDefaultSpecifierTypeClass({
            exported: visitNode(
                target.exported,
                originalSource,
                exportDefaultSpecifierExportedPairs(),
                'ExportDefaultSpecifier.exported',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): ExportDefaultSpecifierFields {
        return this.value;
    }

    getExported(): ExportDefaultSpecifierFields['exported'] {
        return this.value.exported;
    }
}

export const exportDefaultSpecifierTypePair: EvaluatePair<
    ExportDefaultSpecifier,
    ExportDefaultSpecifierTypeClass
> = makeEvaluatePair(isExportDefaultSpecifier, (target, originalSource) =>
    ExportDefaultSpecifierTypeClass.create(target, originalSource),
);

export const isExportDefaultSpecifierType = (
    target: LwcCommonTypeClass<string>,
): target is ExportDefaultSpecifierTypeClass => target instanceof ExportDefaultSpecifierTypeClass;
