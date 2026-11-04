import { isVariableDeclarator, type VariableDeclarator } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class VariableDeclaratorTypeClass extends LwcCommonTypeClass<'variableDeclarator'> {
    private constructor(originalSource: string) {
        super('variableDeclarator', originalSource);
    }

    static create(target: VariableDeclarator, originalSource: string): VariableDeclaratorTypeClass {
        throw new Error('VariableDeclaratorTypeClass.create is not implemented: ' + target.type);
    }
}

export const variableDeclaratorTypePair: EvaluatePair<
    VariableDeclarator,
    VariableDeclaratorTypeClass
> = makeEvaluatePair(isVariableDeclarator, (target, originalSource) =>
    VariableDeclaratorTypeClass.create(target, originalSource),
);

export const isVariableDeclaratorType = (
    target: LwcCommonTypeClass<string>,
): target is VariableDeclaratorTypeClass => target instanceof VariableDeclaratorTypeClass;
