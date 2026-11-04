import { isIfStatement, type IfStatement } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class IfStatementTypeClass extends LwcCommonTypeClass<'ifStatement'> {
    private constructor(originalSource: string) {
        super('ifStatement', originalSource);
    }

    static create(target: IfStatement, originalSource: string): IfStatementTypeClass {
        throw new Error('IfStatementTypeClass.create is not implemented: ' + target.type);
    }
}

export const ifStatementTypePair: EvaluatePair<IfStatement, IfStatementTypeClass> =
    makeEvaluatePair(isIfStatement, (target, originalSource) =>
        IfStatementTypeClass.create(target, originalSource),
    );

export const isIfStatementType = (
    target: LwcCommonTypeClass<string>,
): target is IfStatementTypeClass => target instanceof IfStatementTypeClass;
