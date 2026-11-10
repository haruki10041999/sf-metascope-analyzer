import { type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isImport, type Import } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    getSourceSpan,
} from '../commonVisitor';

export type ImportFields = TypeField<'import'>;

export class ImportTypeClass extends LwcCommonTypeClass<'import', ImportFields> {
    private constructor(sourceSpan: SourceSpan) {
        super('import', {}, sourceSpan);
    }

    static create(target: Import, originalSource: string): ImportTypeClass {
        return new ImportTypeClass(getSourceSpan(target, originalSource));
    }
}

export const importTypePair: EvaluatePair<Import, ImportTypeClass> = makeEvaluatePair(
    isImport,
    (target, originalSource) => ImportTypeClass.create(target, originalSource),
);

export const isImportType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is ImportTypeClass => target instanceof ImportTypeClass;
