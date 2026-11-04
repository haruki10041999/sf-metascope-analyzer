import { isDebuggerStatement, type DebuggerStatement } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class DebuggerStatementTypeClass extends LwcCommonTypeClass<'debuggerStatement'> {
    private constructor(originalSource: string) {
        super('debuggerStatement', originalSource);
    }

    static create(target: DebuggerStatement, originalSource: string): DebuggerStatementTypeClass {
        throw new Error('DebuggerStatementTypeClass.create is not implemented: ' + target.type);
    }
}

export const debuggerStatementTypePair: EvaluatePair<
    DebuggerStatement,
    DebuggerStatementTypeClass
> = makeEvaluatePair(isDebuggerStatement, (target, originalSource) =>
    DebuggerStatementTypeClass.create(target, originalSource),
);

export const isDebuggerStatementType = (
    target: LwcCommonTypeClass<string>,
): target is DebuggerStatementTypeClass => target instanceof DebuggerStatementTypeClass;
