import { isModuleExpression, type ModuleExpression } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class ModuleExpressionTypeClass extends LwcCommonTypeClass<'moduleExpression'> {
    private constructor(originalSource: string) {
        super('moduleExpression', originalSource);
    }

    static create(target: ModuleExpression, originalSource: string): ModuleExpressionTypeClass {
        throw new Error('ModuleExpressionTypeClass.create is not implemented: ' + target.type);
    }
}

export const moduleExpressionTypePair: EvaluatePair<ModuleExpression, ModuleExpressionTypeClass> =
    makeEvaluatePair(isModuleExpression, (target, originalSource) =>
        ModuleExpressionTypeClass.create(target, originalSource),
    );

export const isModuleExpressionType = (
    target: LwcCommonTypeClass<string>,
): target is ModuleExpressionTypeClass => target instanceof ModuleExpressionTypeClass;
