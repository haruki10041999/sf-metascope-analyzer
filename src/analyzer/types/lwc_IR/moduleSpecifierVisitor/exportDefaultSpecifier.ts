import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isExportDefaultSpecifier, type ExportDefaultSpecifier } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    getSourceSpan,
} from '../commonVisitor';
import { IdentifierTypeClass } from '../commons/identifier';

export type ExportDefaultSpecifierFields = TypeField<'exportDefaultSpecifier'> & {
    exported: IdentifierTypeClass;
};

export class ExportDefaultSpecifierTypeClass extends LwcCommonTypeClass<
    'exportDefaultSpecifier',
    ExportDefaultSpecifierFields
> {
    private constructor(value: FieldsOf<ExportDefaultSpecifierFields>, sourceSpan: SourceSpan) {
        super('exportDefaultSpecifier', value, sourceSpan);
    }

    static create(
        target: ExportDefaultSpecifier,
        originalSource: string,
    ): ExportDefaultSpecifierTypeClass {
        return new ExportDefaultSpecifierTypeClass(
            {
                exported: IdentifierTypeClass.create(target.exported, originalSource),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getExported(): ExportDefaultSpecifierFields['exported'] {
        return this.getFields().exported;
    }
}

export const exportDefaultSpecifierTypePair: EvaluatePair<
    ExportDefaultSpecifier,
    ExportDefaultSpecifierTypeClass
> = makeEvaluatePair(isExportDefaultSpecifier, (target, originalSource) =>
    ExportDefaultSpecifierTypeClass.create(target, originalSource),
);

export const isExportDefaultSpecifierType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is ExportDefaultSpecifierTypeClass => target instanceof ExportDefaultSpecifierTypeClass;
