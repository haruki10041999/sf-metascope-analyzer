import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isImportDefaultSpecifier, type ImportDefaultSpecifier } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    getSourceSpan,
} from '../commonVisitor';
import { IdentifierTypeClass } from './identifier';

export type ImportDefaultSpecifierFields = TypeField<'importDefaultSpecifier'> & {
    local: IdentifierTypeClass;
};

export class ImportDefaultSpecifierTypeClass extends LwcCommonTypeClass<
    'importDefaultSpecifier',
    ImportDefaultSpecifierFields
> {
    private constructor(value: FieldsOf<ImportDefaultSpecifierFields>, sourceSpan: SourceSpan) {
        super('importDefaultSpecifier', value, sourceSpan);
    }

    static create(
        target: ImportDefaultSpecifier,
        originalSource: string,
    ): ImportDefaultSpecifierTypeClass {
        return new ImportDefaultSpecifierTypeClass(
            {
                local: IdentifierTypeClass.create(target.local, originalSource),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getLocal(): ImportDefaultSpecifierFields['local'] {
        return this.getFields().local;
    }
}

export const importDefaultSpecifierTypePair: EvaluatePair<
    ImportDefaultSpecifier,
    ImportDefaultSpecifierTypeClass
> = makeEvaluatePair(isImportDefaultSpecifier, (target, originalSource) =>
    ImportDefaultSpecifierTypeClass.create(target, originalSource),
);

export const isImportDefaultSpecifierType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is ImportDefaultSpecifierTypeClass => target instanceof ImportDefaultSpecifierTypeClass;
