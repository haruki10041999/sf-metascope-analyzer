import { isInterpreterDirective, type InterpreterDirective } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class InterpreterDirectiveTypeClass extends LwcCommonTypeClass<'interpreterDirective'> {
    private constructor(originalSource: string) {
        super('interpreterDirective', originalSource);
    }

    static create(
        target: InterpreterDirective,
        originalSource: string,
    ): InterpreterDirectiveTypeClass {
        throw new Error('InterpreterDirectiveTypeClass.create is not implemented: ' + target.type);
    }
}

export const interpreterDirectiveTypePair: EvaluatePair<
    InterpreterDirective,
    InterpreterDirectiveTypeClass
> = makeEvaluatePair(isInterpreterDirective, (target, originalSource) =>
    InterpreterDirectiveTypeClass.create(target, originalSource),
);

export const isInterpreterDirectiveType = (
    target: LwcCommonTypeClass<string>,
): target is InterpreterDirectiveTypeClass => target instanceof InterpreterDirectiveTypeClass;
