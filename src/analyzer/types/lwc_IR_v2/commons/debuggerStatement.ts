import { type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isDebuggerStatement, type DebuggerStatement } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    getSourceSpan,
} from '../commonVisitor';

export type DebuggerStatementFields = TypeField<'debuggerStatement'>;

export class DebuggerStatementTypeClass extends LwcCommonTypeClass<
    'debuggerStatement',
    DebuggerStatementFields
> {
    private constructor(sourceSpan: SourceSpan) {
        super('debuggerStatement', {}, sourceSpan);
    }

    static create(target: DebuggerStatement, originalSource: string): DebuggerStatementTypeClass {
        return new DebuggerStatementTypeClass(getSourceSpan(target, originalSource));
    }
}

export const debuggerStatementTypePair: EvaluatePair<
    DebuggerStatement,
    DebuggerStatementTypeClass
> = makeEvaluatePair(isDebuggerStatement, (target, originalSource) =>
    DebuggerStatementTypeClass.create(target, originalSource),
);

export const isDebuggerStatementType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is DebuggerStatementTypeClass => target instanceof DebuggerStatementTypeClass;
