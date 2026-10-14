import {
    NormalStatementClass,
    isBlockStatementElementClass,
    isDmlStatementElementClass,
    isDoWhileStatementElementClass,
    isExpressionStatementElementClass,
    isForStatementElementClass,
    isIfStatementElementClass,
    isLocalVariableStatementElementClass,
    isMergeStatementElementClass,
    isRunAsStatementElementClass,
    isStringStatementElementClass,
    isSwitchStatementElementClass,
    isTryStatementElementClass,
    isUpsertStatementElementClass,
    isWhileStatementElementClass,
} from '../converter';

import { ExpressionType, makeExpressionType } from '../expression';
import { IfField, makeIfField } from './if';
import { SwitchField, makeSwitchField } from './switch';
import { ForField, makeForField } from './for';
import { WhileField, makeWhileField } from './while';
import { DoWhileField, makeDoWhileField } from './doWhile';
import { TryField, makeTryField } from './try';
import { DmlField, makeDmlField, makeUpsertField, makeMergeField } from './dml';
import { RunAsField, makeRunAsField } from './runAs';
import { LocalVariableField, makeLocalVariableField } from './localVariable';

export type BlockField = {
    kind: 'block';
    block: StatementType[];
};

export type ExpressionStatementField = {
    kind: 'return' | 'expression' | 'throw';
    block: ExpressionType;
};

export type StringStatementField = {
    kind: 'break' | 'continue';
    block: string;
};

export type StatementType =
    | BlockField
    | IfField
    | SwitchField
    | ForField
    | WhileField
    | DoWhileField
    | TryField
    | ExpressionStatementField
    | StringStatementField
    | DmlField
    | RunAsField
    | LocalVariableField;

export const makeBlockField = (statement: NormalStatementClass[]): BlockField | undefined => {
    const statementTypes: StatementType[] = [];

    statement.forEach((s) => {
        const statementType = makeStatementType(s);
        if (statementType) {
            statementTypes.push(statementType);
        }
    });

    if (statementTypes.length > 0) {
        return {
            kind: 'block',
            block: statementTypes,
        };
    }

    return undefined;
};

export const makeStatementType = (statement: NormalStatementClass): StatementType | undefined => {
    const elementClass = statement.getValue();

    if (elementClass) {
        if (isBlockStatementElementClass(elementClass)) {
            const value = makeBlockField(elementClass.getStatement());
            return value;
        }

        if (isIfStatementElementClass(elementClass)) {
            const value = makeIfField(elementClass.getStatement());
            return value;
        }

        if (isSwitchStatementElementClass(elementClass)) {
            const value = makeSwitchField(elementClass.getStatement());
            return value;
        }

        if (isForStatementElementClass(elementClass)) {
            const value = makeForField(elementClass.getStatement());
            return value;
        }

        if (isWhileStatementElementClass(elementClass)) {
            const value = makeWhileField(elementClass.getStatement());
            return value;
        }

        if (isDoWhileStatementElementClass(elementClass)) {
            const value = makeDoWhileField(elementClass.getStatement());
            return value;
        }

        if (isTryStatementElementClass(elementClass)) {
            const value = makeTryField(elementClass.getStatement());
            return value;
        }

        if (isExpressionStatementElementClass(elementClass)) {
            const value = makeExpressionType(elementClass.getStatement());
            if (value) {
                return {
                    kind: elementClass.getType(),
                    block: value,
                };
            }
        }

        if (isStringStatementElementClass(elementClass)) {
            const value = elementClass.getStatement();
            if (value) {
                return {
                    kind: elementClass.getType(),
                    block: value,
                };
            }
        }

        if (isDmlStatementElementClass(elementClass)) {
            return makeDmlField(elementClass.getType(), elementClass.getStatement());
        }

        if (isUpsertStatementElementClass(elementClass)) {
            return makeUpsertField(elementClass.getStatement());
        }

        if (isMergeStatementElementClass(elementClass)) {
            return makeMergeField(elementClass.getStatement());
        }

        if (isRunAsStatementElementClass(elementClass)) {
            return makeRunAsField(elementClass.getStatement());
        }

        if (isLocalVariableStatementElementClass(elementClass)) {
            return makeLocalVariableField(elementClass.getStatement());
        }
    }

    return undefined;
};
