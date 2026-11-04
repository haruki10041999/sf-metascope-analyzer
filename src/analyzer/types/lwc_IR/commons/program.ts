import { isProgram, type Program } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class ProgramTypeClass extends LwcCommonTypeClass<'program'> {
    private constructor(originalSource: string) {
        super('program', originalSource);
    }

    static create(target: Program, originalSource: string): ProgramTypeClass {
        throw new Error('ProgramTypeClass.create is not implemented: ' + target.type);
    }
}

export const programTypePair: EvaluatePair<Program, ProgramTypeClass> = makeEvaluatePair(
    isProgram,
    (target, originalSource) => ProgramTypeClass.create(target, originalSource),
);

export const isProgramType = (target: LwcCommonTypeClass<string>): target is ProgramTypeClass =>
    target instanceof ProgramTypeClass;
