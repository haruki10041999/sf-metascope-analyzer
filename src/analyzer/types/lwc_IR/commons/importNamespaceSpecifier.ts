import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isImportNamespaceSpecifier, type ImportNamespaceSpecifier } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    getSourceSpan,
} from '../commonVisitor';
import { IdentifierTypeClass } from './identifier';

export type ImportNamespaceSpecifierFields = TypeField<'importNamespaceSpecifier'> & {
    local: IdentifierTypeClass;
};

export class ImportNamespaceSpecifierTypeClass extends LwcCommonTypeClass<
    'importNamespaceSpecifier',
    ImportNamespaceSpecifierFields
> {
    private constructor(value: FieldsOf<ImportNamespaceSpecifierFields>, sourceSpan: SourceSpan) {
        super('importNamespaceSpecifier', value, sourceSpan);
    }

    static create(
        target: ImportNamespaceSpecifier,
        originalSource: string,
    ): ImportNamespaceSpecifierTypeClass {
        return new ImportNamespaceSpecifierTypeClass(
            {
                local: IdentifierTypeClass.create(target.local, originalSource),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getLocal(): ImportNamespaceSpecifierFields['local'] {
        return this.getFields().local;
    }
}

export const importNamespaceSpecifierTypePair: EvaluatePair<
    ImportNamespaceSpecifier,
    ImportNamespaceSpecifierTypeClass
> = makeEvaluatePair(isImportNamespaceSpecifier, (target, originalSource) =>
    ImportNamespaceSpecifierTypeClass.create(target, originalSource),
);

export const isImportNamespaceSpecifierType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is ImportNamespaceSpecifierTypeClass =>
    target instanceof ImportNamespaceSpecifierTypeClass;
