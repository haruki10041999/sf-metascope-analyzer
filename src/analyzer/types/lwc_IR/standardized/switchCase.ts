import { isSwitchCase, type SwitchCase } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class SwitchCaseTypeClass extends LwcCommonTypeClass<'switchCase'> {
    private constructor(originalSource: string) {
        super('switchCase', originalSource);
    }

    static create(target: SwitchCase, originalSource: string): SwitchCaseTypeClass {
        throw new Error('SwitchCaseTypeClass.create is not implemented: ' + target.type);
    }
}

export const switchCaseTypePair: EvaluatePair<SwitchCase, SwitchCaseTypeClass> = makeEvaluatePair(
    isSwitchCase,
    (target, originalSource) => SwitchCaseTypeClass.create(target, originalSource),
);

export const isSwitchCaseType = (
    target: LwcCommonTypeClass<string>,
): target is SwitchCaseTypeClass => target instanceof SwitchCaseTypeClass;
