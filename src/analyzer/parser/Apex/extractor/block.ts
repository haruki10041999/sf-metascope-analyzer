import typia from 'typia';

import { NormalStatementClass } from '../../../types/apex/converter';

import { StatementType, makeStatementType } from '../../../types/apex/statement/statement';
import { ExpressionType } from '../../../types/apex/expression';
import { DmlField } from '../../../types/apex/statement/dml';
import { TypeType } from '../../../types/apex/type';
import { ModifierType } from '../../../types/apex/modifier';

type DeclarationReference = {
    kind: 'declarationRef';
    declarationKind: 'localVariable' | 'return' | 'throw' | 'continue' | 'break' | 'dml';
    index?: number;
    variants?: { index: number }[];
};

export const isDeclarationReference = typia.createIs<DeclarationReference>();

type LocalVariableEntry = {
    localVariableIndex: number;
    variant: string;
    variantType: TypeType;
    initialValue?: ExpressionType;
    modifiers?: ModifierType;
};

type BlockEntry = {
    blockIndex: number;
} & (StatementType | DeclarationReference);

type ReturnEntry = { returnIndex: number } & (
    { kind: string; index: number } | { value: ExpressionType | 'return' }
);

type ThrowEntry = { throwIndex: number } & { value: ExpressionType };

type ContinueEntry = { continueIndex: number } & { value: 'continue' };

type BreakEntry = { breakIndex: number } & { value: 'break' };

type DmlEntry = { dmlIndex: number } & DmlField;

export type BlockField = {
    localVariable?: LocalVariableEntry[];
    block: BlockEntry[];
    return?: ReturnEntry[];
    throw?: ThrowEntry[];
    continue?: ContinueEntry[];
    break?: BreakEntry[];
    dml?: DmlEntry[];
};

export const isBlockField = typia.createIs<BlockField>();

export const makeBlockField = (statement: NormalStatementClass[]): BlockField | undefined => {
    const blockField: BlockField = {
        block: [],
    };

    statement.forEach((s, blockIndex) => {
        const statementType = makeStatementType(s);
        if (statementType && 'kind' in statementType) {
            if (statementType.kind === 'localVariable') {
                const valueType = statementType.variantType;
                const modifier = statementType.modifier;

                const variants: {
                    index: number;
                }[] = [];

                statementType.variant.forEach((v) => {
                    const value = v.variant;
                    const initValue = v.initValue;

                    if (!blockField.localVariable) {
                        blockField.localVariable = [];
                    }

                    const localVariableIndex = blockField.localVariable.length + 1;
                    const localVariableEntry: LocalVariableEntry = {
                        localVariableIndex: localVariableIndex,
                        variant: value,
                        variantType: valueType,
                    };

                    if (modifier) {
                        localVariableEntry.modifiers = modifier;
                    }

                    if (initValue) {
                        localVariableEntry.initialValue = initValue;
                    }

                    blockField.localVariable.push(localVariableEntry);
                    variants.push({
                        index: localVariableIndex,
                    });
                });

                blockField.block.push({
                    blockIndex: blockIndex + 1,
                    kind: 'declarationRef',
                    declarationKind: 'localVariable',
                    variants: variants,
                });
            } else if (statementType.kind === 'return') {
                if (!blockField.return) {
                    blockField.return = [];
                }

                const returnValue = statementType.block;
                const returnIndex = blockField.return.length + 1;
                if (returnValue) {
                    blockField.return.push({ returnIndex: returnIndex, value: returnValue });
                } else {
                    blockField.return.push({ returnIndex: returnIndex, value: 'return' });
                }
                blockField.block.push({
                    blockIndex: blockIndex + 1,
                    kind: 'declarationRef',
                    declarationKind: 'return',
                    index: returnIndex,
                });
            } else if (statementType.kind === 'throw') {
                if (!blockField.throw) {
                    blockField.throw = [];
                }
                const throwIndex = blockField.throw.length + 1;
                const expression = statementType.block;
                if (expression) {
                    blockField.throw.push({ throwIndex: throwIndex, value: expression });
                }
                blockField.block.push({
                    blockIndex: blockIndex + 1,
                    kind: 'declarationRef',
                    declarationKind: 'throw',
                    index: throwIndex,
                });
            } else if (statementType.kind === 'break') {
                if (!blockField.break) {
                    blockField.break = [];
                }
                const breakIndex = blockField.break.length + 1;
                blockField.break.push({ breakIndex: breakIndex, value: 'break' });
                blockField.block.push({
                    blockIndex: blockIndex + 1,
                    kind: 'declarationRef',
                    declarationKind: 'break',
                    index: breakIndex,
                });
            } else if (statementType.kind === 'continue') {
                if (!blockField.continue) {
                    blockField.continue = [];
                }
                const continueIndex = blockField.continue.length + 1;
                blockField.continue.push({ continueIndex: continueIndex, value: 'continue' });
                blockField.block.push({
                    blockIndex: blockIndex + 1,
                    kind: 'declarationRef',
                    declarationKind: 'continue',
                    index: continueIndex,
                });
            } else if (
                statementType.kind === 'insert' ||
                statementType.kind === 'update' ||
                statementType.kind === 'delete' ||
                statementType.kind === 'undelete' ||
                statementType.kind === 'upsert' ||
                statementType.kind === 'merge'
            ) {
                if (!blockField.dml) {
                    blockField.dml = [];
                }
                const dmlIndex = blockField.dml.length + 1;
                blockField.dml.push({ dmlIndex: dmlIndex, ...statementType });
                blockField.block.push({
                    blockIndex: blockIndex + 1,
                    kind: 'declarationRef',
                    declarationKind: 'dml',
                    index: dmlIndex,
                });
            } else {
                blockField.block.push({
                    blockIndex: blockIndex + 1,
                    ...statementType,
                });
            }
        }
    });

    if (blockField.block.length > 0) {
        return blockField;
    }

    return undefined;
};

