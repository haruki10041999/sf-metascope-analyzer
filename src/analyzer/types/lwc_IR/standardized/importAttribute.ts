import { isImportAttribute, type ImportAttribute } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class ImportAttributeTypeClass extends LwcCommonTypeClass<'importAttribute'> {
    private constructor(originalSource: string) {
        super('importAttribute', originalSource);
    }

    static create(target: ImportAttribute, originalSource: string): ImportAttributeTypeClass {
        throw new Error('ImportAttributeTypeClass.create is not implemented: ' + target.type);
    }
}

export const importAttributeTypePair: EvaluatePair<ImportAttribute, ImportAttributeTypeClass> =
    makeEvaluatePair(isImportAttribute, (target, originalSource) =>
        ImportAttributeTypeClass.create(target, originalSource),
    );

export const isImportAttributeType = (
    target: LwcCommonTypeClass<string>,
): target is ImportAttributeTypeClass => target instanceof ImportAttributeTypeClass;
