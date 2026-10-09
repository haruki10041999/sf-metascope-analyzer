import {
    ErrorTypeClass,
    AccessLevelTypeClass,
    BreakStatementTypeClass,
    ContinueStatementTypeClass,
    DmlStatementTypeClass,
    DoWhileStatementTypeClass,
    ExpressionAllTypeClass,
    ExpressionStatementTypeClass,
    ForStatementTypeClass,
    IfStatementTypeClass,
    LocalVariableDeclarationStatementTypeClass,
    MergeStatementTypeClass,
    NormalStatementTypeClass,
    ReturnStatementTypeClass,
    RunAsStatementTypeClass,
    SwitchStatementTypeClass,
    ThrowStatementTypeClass,
    TryStatementTypeClass,
    UpsertStatementTypeClass,
    WhileStatementTypeClass,
    isAccessLevelType,
    isBreakStatementType,
    isCatchClauseType,
    isContinueStatementType,
    isDeleteStatementType,
    isDoWhileStatementType,
    isErrorType,
    isExpressionListType,
    isExpressionStatementType,
    isExpressionTypeAll,
    isFinallyBlockType,
    isForControlType,
    isForStatementType,
    isIfStatementType,
    isInsertStatementType,
    isLocalVariableDeclarationStatementType,
    isLocalVariableDeclarationType,
    isMergeStatementType,
    isNormalBlockType,
    isNormalStatementType,
    isParExpressionType,
    isQualifiedNameType,
    isReturnStatementType,
    isRunAsStatementType,
    isSwitchStatementType,
    isThrowStatementType,
    isTryStatementType,
    isUndeleteStatementType,
    isUpdateStatementType,
    isUpsertStatementType,
    isWhenControlType,
    isWhileStatementType,
} from '../../apex_IR';

import { toPrimitiveValue, toTypeClass } from './commons';
import { Expression, expressionConvert, ParExpression, parExpressionConvert } from './expression';
import { ExpressionList, expressionListConvert } from './list';
import { QualifiedName, qualifiedNameConvert } from './name';
import { FinallyBlock, finallyBlockConvert, NormalBlock, normalBlockConvert } from './block';
import { CatchClause, catchClauseConvert } from './clause';
import { ForControl, forControlConvert, WhenControl, whenControlConvert } from './control';
import { LocalVariableDeclaration, localVariableDeclarationConvert } from './declaration';

const expressionOrUndefinedConvert = (
    target: ExpressionAllTypeClass | ErrorTypeClass | null | undefined,
    errorClass: ErrorTypeClass[],
): Expression => {
    const typeClass = target ? toTypeClass(target, isExpressionTypeAll, errorClass) : undefined;
    return typeClass ? expressionConvert(typeClass, errorClass) : undefined;
};

const accessLevelOrUndefinedConvert = (
    target: AccessLevelTypeClass | ErrorTypeClass | null | undefined,
    errorClass: ErrorTypeClass[],
): AccessLevel => {
    const typeClass = target ? toTypeClass(target, isAccessLevelType, errorClass) : undefined;
    return typeClass ? accessLevelConvert(typeClass, errorClass) : undefined;
};

const normalStatementOrUndefinedConvert = (
    target: NormalStatementTypeClass | ErrorTypeClass,
    errorClass: ErrorTypeClass[],
): NormalStatement => {
    const typeClass = toTypeClass(target, isNormalStatementType, errorClass);
    return typeClass ? normalStatementConvert(typeClass, errorClass) : undefined;
};

const isString = (target: unknown): target is string => typeof target === 'string';

export type AccessLevel = string | undefined;

export const accessLevelConvert = (
    target: AccessLevelTypeClass,
    errorClass: ErrorTypeClass[],
): AccessLevel => {
    return toPrimitiveValue(target.getValue(), isString, errorClass);
};

export type BreakStatement = string | undefined;

export const breakStatementConvert = (
    target: BreakStatementTypeClass,
    errorClass: ErrorTypeClass[],
): BreakStatement => {
    return toPrimitiveValue(target.getValue(), isString, errorClass);
};

export type ContinueStatement = string | undefined;

export const continueStatementConvert = (
    target: ContinueStatementTypeClass,
    errorClass: ErrorTypeClass[],
): ContinueStatement => {
    return toPrimitiveValue(target.getValue(), isString, errorClass);
};

// insert / update / delete / undelete 共通
export type DmlStatement = {
    value: Expression;
    accessLevel: AccessLevel;
};

export const dmlStatementConvert = (
    target: DmlStatementTypeClass<ExpressionAllTypeClass>,
    errorClass: ErrorTypeClass[],
): DmlStatement => {
    return {
        value: expressionOrUndefinedConvert(target.getValue(), errorClass),
        accessLevel: accessLevelOrUndefinedConvert(target.getAccessLevel(), errorClass),
    };
};

export type UpsertStatement = DmlStatement & {
    key: QualifiedName;
};

export const upsertStatementConvert = (
    target: UpsertStatementTypeClass,
    errorClass: ErrorTypeClass[],
): UpsertStatement => {
    const keyValue = target.getKey();
    const keyTypeClass = keyValue
        ? toTypeClass(keyValue, isQualifiedNameType, errorClass)
        : undefined;

    return {
        ...dmlStatementConvert(target, errorClass),
        key: keyTypeClass ? qualifiedNameConvert(keyTypeClass, errorClass) : undefined,
    };
};

export type MergeStatement = {
    value: Expression[] | undefined;
    accessLevel: AccessLevel;
};

export const mergeStatementConvert = (
    target: MergeStatementTypeClass,
    errorClass: ErrorTypeClass[],
): MergeStatement => {
    const values: Expression[] = [];
    target.getValue().forEach((item) => {
        values.push(expressionOrUndefinedConvert(item, errorClass));
    });

    return {
        value: values.length > 0 ? values : undefined,
        accessLevel: accessLevelOrUndefinedConvert(target.getAccessLevel(), errorClass),
    };
};

export type DoWhileStatement = {
    value: ParExpression;
    block: NormalBlock;
};

export const doWhileStatementConvert = (
    target: DoWhileStatementTypeClass,
    errorClass: ErrorTypeClass[],
): DoWhileStatement => {
    const valueTypeClass = toTypeClass(target.getValue(), isParExpressionType, errorClass);
    const blockTypeClass = toTypeClass(target.getBlock(), isNormalBlockType, errorClass);

    return {
        value: valueTypeClass ? parExpressionConvert(valueTypeClass, errorClass) : undefined,
        block: blockTypeClass ? normalBlockConvert(blockTypeClass, errorClass) : undefined,
    };
};

export type ExpressionStatement = Expression;

export const expressionStatementConvert = (
    target: ExpressionStatementTypeClass,
    errorClass: ErrorTypeClass[],
): ExpressionStatement => {
    return expressionOrUndefinedConvert(target.getValue(), errorClass);
};

export type ForStatement = {
    value: ForControl | undefined;
    block: NormalStatement;
};

export const forStatementConvert = (
    target: ForStatementTypeClass,
    errorClass: ErrorTypeClass[],
): ForStatement => {
    const valueTypeClass = toTypeClass(target.getValue(), isForControlType, errorClass);

    return {
        value: valueTypeClass ? forControlConvert(valueTypeClass, errorClass) : undefined,
        block: normalStatementOrUndefinedConvert(target.getBlock(), errorClass),
    };
};

export type IfStatement =
    | {
          value: ParExpression | 'else';
          block: NormalStatement;
      }[]
    | undefined;

export const ifStatementConvert = (
    target: IfStatementTypeClass,
    errorClass: ErrorTypeClass[],
): IfStatement => {
    const value = target.getValue();
    if (!Array.isArray(value)) {
        errorClass.push(value);
        return undefined;
    }

    const values = value.map((item) => {
        let condition: ParExpression | 'else' = undefined;
        if (item.value === 'else') {
            condition = item.value;
        } else {
            const conditionTypeClass = toTypeClass(item.value, isParExpressionType, errorClass);
            condition = conditionTypeClass
                ? parExpressionConvert(conditionTypeClass, errorClass)
                : undefined;
        }

        return {
            value: condition,
            block: normalStatementOrUndefinedConvert(item.block, errorClass),
        };
    });

    return values.length > 0 ? values : undefined;
};

export type LocalVariableDeclarationStatement = LocalVariableDeclaration | undefined;

export const localVariableDeclarationStatementConvert = (
    target: LocalVariableDeclarationStatementTypeClass,
    errorClass: ErrorTypeClass[],
): LocalVariableDeclarationStatement => {
    const valueTypeClass = toTypeClass(
        target.getValue(),
        isLocalVariableDeclarationType,
        errorClass,
    );
    return valueTypeClass ? localVariableDeclarationConvert(valueTypeClass, errorClass) : undefined;
};

export type ReturnStatement = Expression;

export const returnStatementConvert = (
    target: ReturnStatementTypeClass,
    errorClass: ErrorTypeClass[],
): ReturnStatement => {
    return expressionOrUndefinedConvert(target.getValue(), errorClass);
};

export type RunAsStatement = {
    value: ExpressionList;
    block: NormalBlock;
};

export const runAsStatementConvert = (
    target: RunAsStatementTypeClass,
    errorClass: ErrorTypeClass[],
): RunAsStatement => {
    const valueTypeClass = toTypeClass(target.getValue(), isExpressionListType, errorClass);
    const blockTypeClass = toTypeClass(target.getBlock(), isNormalBlockType, errorClass);

    return {
        value: valueTypeClass ? expressionListConvert(valueTypeClass, errorClass) : undefined,
        block: blockTypeClass ? normalBlockConvert(blockTypeClass, errorClass) : undefined,
    };
};

export type SwitchStatement = {
    value: Expression;
    block: WhenControl[] | undefined;
};

export const switchStatementConvert = (
    target: SwitchStatementTypeClass,
    errorClass: ErrorTypeClass[],
): SwitchStatement => {
    const block: WhenControl[] = [];
    target.getBlocks().forEach((item) => {
        const whenTypeClass = toTypeClass(item, isWhenControlType, errorClass);
        if (whenTypeClass) {
            block.push(whenControlConvert(whenTypeClass, errorClass));
        }
    });

    return {
        value: expressionOrUndefinedConvert(target.getValue(), errorClass),
        block: block.length > 0 ? block : undefined,
    };
};

export type ThrowStatement = Expression;

export const throwStatementConvert = (
    target: ThrowStatementTypeClass,
    errorClass: ErrorTypeClass[],
): ThrowStatement => {
    return expressionOrUndefinedConvert(target.getValue(), errorClass);
};

export type TryStatement = {
    value: NormalBlock;
    catchBlock: CatchClause[] | undefined;
    finallyBlock: FinallyBlock;
};

export const tryStatementConvert = (
    target: TryStatementTypeClass,
    errorClass: ErrorTypeClass[],
): TryStatement => {
    const valueTypeClass = toTypeClass(target.getValue(), isNormalBlockType, errorClass);

    const catchBlock: CatchClause[] = [];
    target.getCatchBlock().forEach((item) => {
        const catchTypeClass = toTypeClass(item, isCatchClauseType, errorClass);
        if (catchTypeClass) {
            catchBlock.push(catchClauseConvert(catchTypeClass, errorClass));
        }
    });

    const finallyValue = target.getFinallyBlock();
    const finallyTypeClass = finallyValue
        ? toTypeClass(finallyValue, isFinallyBlockType, errorClass)
        : undefined;

    return {
        value: valueTypeClass ? normalBlockConvert(valueTypeClass, errorClass) : undefined,
        catchBlock: catchBlock.length > 0 ? catchBlock : undefined,
        finallyBlock: finallyTypeClass
            ? finallyBlockConvert(finallyTypeClass, errorClass)
            : undefined,
    };
};

export type WhileStatement = {
    value: ParExpression;
    block: NormalStatement;
};

export const whileStatementConvert = (
    target: WhileStatementTypeClass,
    errorClass: ErrorTypeClass[],
): WhileStatement => {
    const valueTypeClass = toTypeClass(target.getValue(), isParExpressionType, errorClass);

    return {
        value: valueTypeClass ? parExpressionConvert(valueTypeClass, errorClass) : undefined,
        block: normalStatementOrUndefinedConvert(target.getBlock(), errorClass),
    };
};

export type NormalStatement =
    | {
          type: string;
          statement:
              | NormalBlock
              | IfStatement
              | SwitchStatement
              | ForStatement
              | WhileStatement
              | DoWhileStatement
              | TryStatement
              | ReturnStatement
              | ThrowStatement
              | BreakStatement
              | ContinueStatement
              | DmlStatement
              | UpsertStatement
              | MergeStatement
              | RunAsStatement
              | LocalVariableDeclarationStatement
              | ExpressionStatement;
      }
    | undefined;

export const normalStatementConvert = (
    target: NormalStatementTypeClass,
    errorClass: ErrorTypeClass[],
): NormalStatement => {
    const value = target.getValue();
    if (isErrorType(value)) {
        errorClass.push(value);
        return undefined;
    }

    if (isNormalBlockType(value)) {
        return {
            type: 'block',
            statement: normalBlockConvert(value, errorClass),
        };
    }
    if (isIfStatementType(value)) {
        return {
            type: 'if',
            statement: ifStatementConvert(value, errorClass),
        };
    }
    if (isSwitchStatementType(value)) {
        return {
            type: 'switch',
            statement: switchStatementConvert(value, errorClass),
        };
    }
    if (isForStatementType(value)) {
        return {
            type: 'for',
            statement: forStatementConvert(value, errorClass),
        };
    }
    if (isWhileStatementType(value)) {
        return {
            type: 'while',
            statement: whileStatementConvert(value, errorClass),
        };
    }
    if (isDoWhileStatementType(value)) {
        return {
            type: 'doWhile',
            statement: doWhileStatementConvert(value, errorClass),
        };
    }
    if (isTryStatementType(value)) {
        return {
            type: 'try',
            statement: tryStatementConvert(value, errorClass),
        };
    }
    if (isReturnStatementType(value)) {
        return {
            type: 'return',
            statement: returnStatementConvert(value, errorClass),
        };
    }
    if (isThrowStatementType(value)) {
        return {
            type: 'throw',
            statement: throwStatementConvert(value, errorClass),
        };
    }
    if (isBreakStatementType(value)) {
        return {
            type: 'break',
            statement: breakStatementConvert(value, errorClass),
        };
    }
    if (isContinueStatementType(value)) {
        return {
            type: 'continue',
            statement: continueStatementConvert(value, errorClass),
        };
    }
    if (
        isInsertStatementType(value) ||
        isUpdateStatementType(value) ||
        isDeleteStatementType(value) ||
        isUndeleteStatementType(value)
    ) {
        return {
            type: isInsertStatementType(value)
                ? 'insert'
                : isUpdateStatementType(value)
                  ? 'update'
                  : isDeleteStatementType(value)
                    ? 'delete'
                    : 'undelete',
            statement: dmlStatementConvert(value, errorClass),
        };
    }
    if (isUpsertStatementType(value)) {
        return {
            type: 'upsert',
            statement: upsertStatementConvert(value, errorClass),
        };
    }
    if (isMergeStatementType(value)) {
        return {
            type: 'merge',
            statement: mergeStatementConvert(value, errorClass),
        };
    }
    if (isRunAsStatementType(value)) {
        return {
            type: 'runAs',
            statement: runAsStatementConvert(value, errorClass),
        };
    }
    if (isLocalVariableDeclarationStatementType(value)) {
        return {
            type: 'localVariable',
            statement: localVariableDeclarationStatementConvert(value, errorClass),
        };
    }
    if (isExpressionStatementType(value)) {
        return {
            type: 'expression',
            statement: expressionStatementConvert(value, errorClass),
        };
    }

    return undefined;
};
