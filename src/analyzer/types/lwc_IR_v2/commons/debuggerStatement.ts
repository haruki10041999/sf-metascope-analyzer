import { isDebuggerStatement, type DebuggerStatement } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class DebuggerStatementTypeClass extends LwcCommonTypeClass<'debuggerStatement'> {
    private constructor() {
        super('debuggerStatement');
    }

    static create(_target: DebuggerStatement, _originalSource: string): DebuggerStatementTypeClass {
        return new DebuggerStatementTypeClass();
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
