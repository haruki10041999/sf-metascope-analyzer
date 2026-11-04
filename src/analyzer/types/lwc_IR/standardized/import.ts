import { isImport, type Import } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class ImportTypeClass extends LwcCommonTypeClass<'import'> {
    private constructor(originalSource: string) {
        super('import', originalSource);
    }

    static create(target: Import, originalSource: string): ImportTypeClass {
        throw new Error('ImportTypeClass.create is not implemented: ' + target.type);
    }
}

export const importTypePair: EvaluatePair<Import, ImportTypeClass> = makeEvaluatePair(
    isImport,
    (target, originalSource) => ImportTypeClass.create(target, originalSource),
);

export const isImportType = (target: LwcCommonTypeClass<string>): target is ImportTypeClass =>
    target instanceof ImportTypeClass;
