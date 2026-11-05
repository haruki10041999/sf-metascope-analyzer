import { isImport, type Import } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class ImportTypeClass extends LwcCommonTypeClass<'import'> {
    private constructor() {
        super('import');
    }

    static create(_target: Import, _originalSource: string): ImportTypeClass {
        return new ImportTypeClass();
    }
}

export const importTypePair: EvaluatePair<Import, ImportTypeClass> = makeEvaluatePair(
    isImport,
    (target, originalSource) => ImportTypeClass.create(target, originalSource),
);

export const isImportType = (target: LwcCommonTypeClass<string>): target is ImportTypeClass =>
    target instanceof ImportTypeClass;
