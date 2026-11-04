import { isImportExpression, type ImportExpression } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class ImportExpressionTypeClass extends LwcCommonTypeClass<'importExpression'> {
    private constructor(originalSource: string) {
        super('importExpression', originalSource);
    }

    static create(target: ImportExpression, originalSource: string): ImportExpressionTypeClass {
        throw new Error('ImportExpressionTypeClass.create is not implemented: ' + target.type);
    }
}

export const importExpressionTypePair: EvaluatePair<ImportExpression, ImportExpressionTypeClass> =
    makeEvaluatePair(isImportExpression, (target, originalSource) =>
        ImportExpressionTypeClass.create(target, originalSource),
    );

export const isImportExpressionType = (
    target: LwcCommonTypeClass<string>,
): target is ImportExpressionTypeClass => target instanceof ImportExpressionTypeClass;
