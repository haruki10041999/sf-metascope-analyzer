import { isSwitchStatement, type SwitchStatement } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class SwitchStatementTypeClass extends LwcCommonTypeClass<'switchStatement'> {
    private constructor(originalSource: string) {
        super('switchStatement', originalSource);
    }

    static create(target: SwitchStatement, originalSource: string): SwitchStatementTypeClass {
        throw new Error('SwitchStatementTypeClass.create is not implemented: ' + target.type);
    }
}

export const switchStatementTypePair: EvaluatePair<SwitchStatement, SwitchStatementTypeClass> =
    makeEvaluatePair(isSwitchStatement, (target, originalSource) =>
        SwitchStatementTypeClass.create(target, originalSource),
    );

export const isSwitchStatementType = (
    target: LwcCommonTypeClass<string>,
): target is SwitchStatementTypeClass => target instanceof SwitchStatementTypeClass;
