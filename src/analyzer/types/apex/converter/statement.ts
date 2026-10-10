import {
    ErrorTypeClass,
    AccessLevelTypeClass,
    BreakStatementTypeClass,
    ContinueStatementTypeClass,
    DoWhileStatementTypeClass,
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
    isExpressionListType,
    isExpressionStatementType,
    isExpressionTypeAll,
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
    InsertStatementTypeClass,
    UpdateStatementTypeClass,
    DeleteStatementTypeClass,
    UndeleteStatementTypeClass,
    isStatementTypeAll,
    isFinallyBlockType,
} from '../../apex_IR';

import { toPrimitiveValue, toTypeClass } from './commons';
import { Expression, expressionConvert, parExpressionConvert } from './expression';
import { expressionListConvert } from './list';
import { qualifiedNameConvert } from './name';
import { finallyBlockConvert, normalBlockConvert } from './block';
import { CatchClause, catchClauseConvert } from './clause';
import { ForControl, forControlConvert, WhenControl, whenControlConvert } from './control';
import { LocalVariableDeclaration, localVariableDeclarationConvert } from './declaration';

export const accessLevelConvert = (
    target: AccessLevelTypeClass,
    errorClass: ErrorTypeClass[],
): string | undefined => {
    return toPrimitiveValue(
        target.getValue(),
        (target): target is string => typeof target === 'string',
        errorClass,
    );
};

export const breakStatementConvert = (
    target: BreakStatementTypeClass,
    errorClass: ErrorTypeClass[],
): string | undefined => {
    return toPrimitiveValue(
        target.getValue(),
        (target): target is string => typeof target === 'string',
        errorClass,
    );
};

export const continueStatementConvert = (
    target: ContinueStatementTypeClass,
    errorClass: ErrorTypeClass[],
): string | undefined => {
    return toPrimitiveValue(
        target.getValue(),
        (target): target is string => typeof target === 'string',
        errorClass,
    );
};

export type DmlStatement = {
    value?: Expression;
    accessLevel?: string;
};

export const insertStatementConvert = (
    target: InsertStatementTypeClass,
    errorClass: ErrorTypeClass[],
): DmlStatement => {
    const insertStatement: DmlStatement = {};

    const valueTypeClass = toTypeClass(target.getValue(), isExpressionTypeAll, errorClass);
    if (valueTypeClass) {
        const expression = expressionConvert(valueTypeClass, errorClass);
        if (expression) {
            insertStatement.value = expression;
        }
    }

    const accessLevelTypeClass = target.getAccessLevel();
    if (accessLevelTypeClass) {
        const typeClass = toTypeClass(accessLevelTypeClass, isAccessLevelType, errorClass);
        if (typeClass) {
            const accessLevel = accessLevelConvert(typeClass, errorClass);
            if (accessLevel) {
                insertStatement.accessLevel = accessLevel;
            }
        }
    }

    return insertStatement;
};

export const updatetatementConvert = (
    target: UpdateStatementTypeClass,
    errorClass: ErrorTypeClass[],
): DmlStatement => {
    const updateStatement: DmlStatement = {};

    const valueTypeClass = toTypeClass(target.getValue(), isExpressionTypeAll, errorClass);
    if (valueTypeClass) {
        const expression = expressionConvert(valueTypeClass, errorClass);
        if (expression) {
            updateStatement.value = expression;
        }
    }

    const accessLevelTypeClass = target.getAccessLevel();
    if (accessLevelTypeClass) {
        const typeClass = toTypeClass(accessLevelTypeClass, isAccessLevelType, errorClass);
        if (typeClass) {
            const accessLevel = accessLevelConvert(typeClass, errorClass);
            if (accessLevel) {
                updateStatement.accessLevel = accessLevel;
            }
        }
    }

    return updateStatement;
};

export const deletetatementConvert = (
    target: DeleteStatementTypeClass,
    errorClass: ErrorTypeClass[],
): DmlStatement => {
    const deleteStatement: DmlStatement = {};

    const valueTypeClass = toTypeClass(target.getValue(), isExpressionTypeAll, errorClass);
    if (valueTypeClass) {
        const expression = expressionConvert(valueTypeClass, errorClass);
        if (expression) {
            deleteStatement.value = expression;
        }
    }

    const accessLevelTypeClass = target.getAccessLevel();
    if (accessLevelTypeClass) {
        const typeClass = toTypeClass(accessLevelTypeClass, isAccessLevelType, errorClass);
        if (typeClass) {
            const accessLevel = accessLevelConvert(typeClass, errorClass);
            if (accessLevel) {
                deleteStatement.accessLevel = accessLevel;
            }
        }
    }

    return deleteStatement;
};

export const undeletetatementConvert = (
    target: UndeleteStatementTypeClass,
    errorClass: ErrorTypeClass[],
): DmlStatement => {
    const undeleteStatement: DmlStatement = {};

    const valueTypeClass = toTypeClass(target.getValue(), isExpressionTypeAll, errorClass);
    if (valueTypeClass) {
        const expression = expressionConvert(valueTypeClass, errorClass);
        if (expression) {
            undeleteStatement.value = expression;
        }
    }

    const accessLevelTypeClass = target.getAccessLevel();
    if (accessLevelTypeClass) {
        const typeClass = toTypeClass(accessLevelTypeClass, isAccessLevelType, errorClass);
        if (typeClass) {
            const accessLevel = accessLevelConvert(typeClass, errorClass);
            if (accessLevel) {
                undeleteStatement.accessLevel = accessLevel;
            }
        }
    }

    return undeleteStatement;
};

export type UpsertStatement = {
    value?: Expression;
    accessLevel?: string;
    key: string[];
};

export const upsertStatementConvert = (
    target: UpsertStatementTypeClass,
    errorClass: ErrorTypeClass[],
): UpsertStatement => {
    const upsertStatement: UpsertStatement = {
        key: [],
    };
    const keyValue = target.getKey();
    if (keyValue) {
        const typeClass = toTypeClass(keyValue, isQualifiedNameType, errorClass);
        if (typeClass) {
            const key = qualifiedNameConvert(typeClass, errorClass);
            if (key) {
                upsertStatement.key.push(...key);
            }
        }
    }

    const valueTypeClass = toTypeClass(target.getValue(), isExpressionTypeAll, errorClass);
    if (valueTypeClass) {
        const expression = expressionConvert(valueTypeClass, errorClass);
        if (expression) {
            upsertStatement.value = expression;
        }
    }

    const accessLevelTypeClass = target.getAccessLevel();
    if (accessLevelTypeClass) {
        const typeClass = toTypeClass(accessLevelTypeClass, isAccessLevelType, errorClass);
        if (typeClass) {
            const accessLevel = accessLevelConvert(typeClass, errorClass);
            if (accessLevel) {
                upsertStatement.accessLevel = accessLevel;
            }
        }
    }

    return upsertStatement;
};

export type MergeStatement = {
    value: Expression[];
    accessLevel?: string;
};

export const mergeStatementConvert = (
    target: MergeStatementTypeClass,
    errorClass: ErrorTypeClass[],
): MergeStatement => {
    const values: Expression[] = [];
    target.getValue().forEach((item) => {
        const typeClass = toTypeClass(item, isExpressionTypeAll, errorClass);
        if (typeClass) {
            const expression = expressionConvert(typeClass, errorClass);
            if (expression) {
                values.push(expression);
            }
        }
    });

    const mergeStatement: MergeStatement = {
        value: values,
    };

    const accessLevelTypeClass = target.getAccessLevel();
    if (accessLevelTypeClass) {
        const typeClass = toTypeClass(accessLevelTypeClass, isAccessLevelType, errorClass);
        if (typeClass) {
            const accessLevel = accessLevelConvert(typeClass, errorClass);
            if (accessLevel) {
                mergeStatement.accessLevel = accessLevel;
            }
        }
    }

    return mergeStatement;
};

export type DoWhileStatement = {
    value?: Expression;
    block: NormalStatement[];
};

export const doWhileStatementConvert = (
    target: DoWhileStatementTypeClass,
    errorClass: ErrorTypeClass[],
): DoWhileStatement => {
    const block: NormalStatement[] = [];
    const blockTypeClass = toTypeClass(target.getBlock(), isNormalBlockType, errorClass);
    if (blockTypeClass) {
        block.push(...normalBlockConvert(blockTypeClass, errorClass));
    }

    const doWhileStatement: DoWhileStatement = {
        block: block,
    };

    const valueTypeClass = toTypeClass(target.getValue(), isParExpressionType, errorClass);
    if (valueTypeClass) {
        const expression = parExpressionConvert(valueTypeClass, errorClass);
        if (expression) {
            doWhileStatement.value = expression;
        }
    }

    return doWhileStatement;
};

export const expressionStatementConvert = (
    target: ExpressionStatementTypeClass,
    errorClass: ErrorTypeClass[],
): Expression | undefined => {
    const valueTypeClass = toTypeClass(target.getValue(), isExpressionTypeAll, errorClass);
    if (valueTypeClass) {
        return expressionConvert(valueTypeClass, errorClass);
    }

    return undefined;
};

export type ForStatement = {
    value: ForControl;
    block?: NormalStatement;
};

export const forStatementConvert = (
    target: ForStatementTypeClass,
    errorClass: ErrorTypeClass[],
): ForStatement => {
    const forStatement: ForStatement = {
        value: {
            update: [],
        },
    };

    const valueTypeClass = toTypeClass(target.getValue(), isForControlType, errorClass);
    if (valueTypeClass) {
        const forControl = forControlConvert(valueTypeClass, errorClass);
        forStatement.value.update.push(...forControl.update);
        if (forControl.init) {
            forStatement.value.init = forControl.init;
        }
        if (forControl.value) {
            forStatement.value.value = forControl.value;
        }
    }

    const blockTypeClass = toTypeClass(target.getBlock(), isNormalStatementType, errorClass);
    if (blockTypeClass) {
        const statement = normalStatementConvert(blockTypeClass, errorClass);
        if (statement) {
            forStatement.block = statement;
        }
    }

    return forStatement;
};

export type IfStatement = {
    value?: Expression | 'else';
    block?: NormalStatement;
}[];

export const ifStatementConvert = (
    target: IfStatementTypeClass,
    errorClass: ErrorTypeClass[],
): IfStatement => {
    const value = target.getValue();

    if (!Array.isArray(value)) {
        errorClass.push(value);
        return [];
    }

    const values: IfStatement = [];

    value.forEach((item) => {
        const ifStatementBlock: {
            value?: Expression | 'else';
            block?: NormalStatement;
        } = {};

        const value = item.value;
        if (typeof value === 'string') {
            ifStatementBlock.value = value;
        } else {
            const valueTypeClass = toTypeClass(value, isParExpressionType, errorClass);
            if (valueTypeClass) {
                const expression = parExpressionConvert(valueTypeClass, errorClass);
                if (expression) {
                    ifStatementBlock.value = expression;
                }
            }
        }

        const blockTypeClass = toTypeClass(item.block, isNormalStatementType, errorClass);
        if (blockTypeClass) {
            const statement = normalStatementConvert(blockTypeClass, errorClass);
            if (statement) {
                ifStatementBlock.block = statement;
            }
        }

        values.push(ifStatementBlock);
    });

    return values;
};

export const localVariableDeclarationStatementConvert = (
    target: LocalVariableDeclarationStatementTypeClass,
    errorClass: ErrorTypeClass[],
): LocalVariableDeclaration => {
    const localVariableDeclarationStatement: LocalVariableDeclaration = {
        value: [],
        valueType: {
            value: [],
        },
        modifier: [],
    };

    const valueTypeClass = toTypeClass(
        target.getValue(),
        isLocalVariableDeclarationType,
        errorClass,
    );
    if (valueTypeClass) {
        const localVariableDeclaration = localVariableDeclarationConvert(
            valueTypeClass,
            errorClass,
        );

        localVariableDeclarationStatement.value.push(...localVariableDeclaration.value);
        localVariableDeclarationStatement.valueType.value.push(
            ...localVariableDeclaration.valueType.value,
        );
        localVariableDeclarationStatement.modifier.push(...localVariableDeclaration.modifier);
        if (localVariableDeclaration.valueType.dimension) {
            localVariableDeclarationStatement.valueType.dimension =
                localVariableDeclaration.valueType.dimension;
        }
    }

    return localVariableDeclarationStatement;
};

export const returnStatementConvert = (
    target: ReturnStatementTypeClass,
    errorClass: ErrorTypeClass[],
): Expression | undefined => {
    const value = target.getValue();
    if (value) {
        const valueTypeClass = toTypeClass(value, isExpressionTypeAll, errorClass);
        if (valueTypeClass) {
            return expressionConvert(valueTypeClass, errorClass);
        }
    }

    return undefined;
};

export type RunAsStatement = {
    value: Expression[];
    block: NormalStatement[];
};

export const runAsStatementConvert = (
    target: RunAsStatementTypeClass,
    errorClass: ErrorTypeClass[],
): RunAsStatement => {
    const value: Expression[] = [];
    const valueTypeClass = toTypeClass(target.getValue(), isExpressionListType, errorClass);
    if (valueTypeClass) {
        value.push(...expressionListConvert(valueTypeClass, errorClass));
    }

    const block: NormalStatement[] = [];
    const blockTypeClass = toTypeClass(target.getBlock(), isNormalBlockType, errorClass);
    if (blockTypeClass) {
        block.push(...normalBlockConvert(blockTypeClass, errorClass));
    }

    return {
        value: value,
        block: block,
    };
};

export type SwitchStatement = {
    value?: Expression;
    block: WhenControl[];
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

    const switchStatement: SwitchStatement = {
        block: block,
    };

    const valueTypeClass = toTypeClass(target.getValue(), isExpressionTypeAll, errorClass);
    if (valueTypeClass) {
        const expression = expressionConvert(valueTypeClass, errorClass);
        if (expression) {
            switchStatement.value = expression;
        }
    }

    return switchStatement;
};

export const throwStatementConvert = (
    target: ThrowStatementTypeClass,
    errorClass: ErrorTypeClass[],
): Expression | undefined => {
    const value = target.getValue();
    if (value) {
        const valueTypeClass = toTypeClass(value, isExpressionTypeAll, errorClass);
        if (valueTypeClass) {
            return expressionConvert(valueTypeClass, errorClass);
        }
    }

    return undefined;
};

export type TryStatement = {
    value: NormalStatement[];
    catchBlock: CatchClause[];
    finallyBlock: NormalStatement[];
};

export const tryStatementConvert = (
    target: TryStatementTypeClass,
    errorClass: ErrorTypeClass[],
): TryStatement => {
    const value: NormalStatement[] = [];
    const valueTypeClass = toTypeClass(target.getValue(), isNormalBlockType, errorClass);
    if (valueTypeClass) {
        value.push(...normalBlockConvert(valueTypeClass, errorClass));
    }

    const catchBlock: CatchClause[] = [];
    target.getCatchBlock().forEach((item) => {
        const catchTypeClass = toTypeClass(item, isCatchClauseType, errorClass);
        if (catchTypeClass) {
            catchBlock.push(catchClauseConvert(catchTypeClass, errorClass));
        }
    });

    const finallyBlock: NormalStatement[] = [];
    const finallyValue = target.getFinallyBlock();
    if (finallyValue) {
        const finallyTypeClass = toTypeClass(finallyValue, isFinallyBlockType, errorClass);
        if (finallyTypeClass) {
            finallyBlock.push(...finallyBlockConvert(finallyTypeClass, errorClass));
        }
    }

    return {
        value: value,
        catchBlock: catchBlock,
        finallyBlock: finallyBlock,
    };
};

export type WhileStatement = {
    value?: Expression;
    block?: NormalStatement;
};

export const whileStatementConvert = (
    target: WhileStatementTypeClass,
    errorClass: ErrorTypeClass[],
): WhileStatement => {
    const whileStatement: WhileStatement = {};

    const valueTypeClass = toTypeClass(target.getValue(), isParExpressionType, errorClass);
    if (valueTypeClass) {
        const expression = parExpressionConvert(valueTypeClass, errorClass);
        if (expression) {
            whileStatement.value = expression;
        }
    }

    const blockTypeClass = toTypeClass(target.getBlock(), isNormalStatementType, errorClass);
    if (blockTypeClass) {
        const statement = normalStatementConvert(blockTypeClass, errorClass);
        if (statement) {
            whileStatement.block = statement;
        }
    }

    return whileStatement;
};

export type NormalStatement =
    | {
          type: 'block';
          statement: NormalStatement[];
      }
    | {
          type: 'if';
          statement: IfStatement;
      }
    | {
          type: 'switch';
          statement: SwitchStatement;
      }
    | {
          type: 'for';
          statement: ForStatement;
      }
    | {
          type: 'while';
          statement: WhileStatement;
      }
    | {
          type: 'doWhile';
          statement: DoWhileStatement;
      }
    | {
          type: 'try';
          statement: TryStatement;
      }
    | {
          type: 'return' | 'expression' | 'throw';
          statement?: Expression;
      }
    | {
          type: 'break' | 'continue';
          statement?: string;
      }
    | {
          type: 'insert' | 'update' | 'delete' | 'undelete';
          statement: DmlStatement;
      }
    | {
          type: 'upsert';
          statement: UpsertStatement;
      }
    | {
          type: 'merge';
          statement: MergeStatement;
      }
    | {
          type: 'runAs';
          statement: RunAsStatement;
      }
    | {
          type: 'localVariable';
          statement: LocalVariableDeclaration;
      };

export const normalStatementConvert = (
    target: NormalStatementTypeClass,
    errorClass: ErrorTypeClass[],
): NormalStatement | undefined => {
    const valueTypeClass = toTypeClass(target.getValue(), isStatementTypeAll, errorClass);

    let statement: NormalStatement | undefined = undefined;

    if (valueTypeClass) {
        if (isNormalBlockType(valueTypeClass)) {
            statement = {
                type: 'block',
                statement: normalBlockConvert(valueTypeClass, errorClass),
            };
        }
        if (isIfStatementType(valueTypeClass)) {
            statement = {
                type: 'if',
                statement: ifStatementConvert(valueTypeClass, errorClass),
            };
        }
        if (isSwitchStatementType(valueTypeClass)) {
            statement = {
                type: 'switch',
                statement: switchStatementConvert(valueTypeClass, errorClass),
            };
        }
        if (isForStatementType(valueTypeClass)) {
            statement = {
                type: 'for',
                statement: forStatementConvert(valueTypeClass, errorClass),
            };
        }
        if (isWhileStatementType(valueTypeClass)) {
            statement = {
                type: 'while',
                statement: whileStatementConvert(valueTypeClass, errorClass),
            };
        }
        if (isDoWhileStatementType(valueTypeClass)) {
            statement = {
                type: 'doWhile',
                statement: doWhileStatementConvert(valueTypeClass, errorClass),
            };
        }
        if (isTryStatementType(valueTypeClass)) {
            statement = {
                type: 'try',
                statement: tryStatementConvert(valueTypeClass, errorClass),
            };
        }
        if (isReturnStatementType(valueTypeClass)) {
            statement = { type: 'return' };

            const value = returnStatementConvert(valueTypeClass, errorClass);
            if (value) {
                statement.statement = value;
            }
        }
        if (isThrowStatementType(valueTypeClass)) {
            statement = { type: 'throw' };

            const value = throwStatementConvert(valueTypeClass, errorClass);
            if (value) {
                statement.statement = value;
            }
        }
        if (isBreakStatementType(valueTypeClass)) {
            statement = { type: 'break' };

            const value = breakStatementConvert(valueTypeClass, errorClass);
            if (value) {
                statement.statement = value;
            }
        }
        if (isContinueStatementType(valueTypeClass)) {
            statement = { type: 'continue' };

            const value = continueStatementConvert(valueTypeClass, errorClass);
            if (value) {
                statement.statement = value;
            }
        }
        if (isInsertStatementType(valueTypeClass)) {
            statement = {
                type: 'insert',
                statement: insertStatementConvert(valueTypeClass, errorClass),
            };
        }
        if (isUpdateStatementType(valueTypeClass)) {
            statement = {
                type: 'update',
                statement: updatetatementConvert(valueTypeClass, errorClass),
            };
        }
        if (isDeleteStatementType(valueTypeClass)) {
            statement = {
                type: 'delete',
                statement: deletetatementConvert(valueTypeClass, errorClass),
            };
        }
        if (isUndeleteStatementType(valueTypeClass)) {
            statement = {
                type: 'undelete',
                statement: undeletetatementConvert(valueTypeClass, errorClass),
            };
        }
        if (isUpsertStatementType(valueTypeClass)) {
            statement = {
                type: 'upsert',
                statement: upsertStatementConvert(valueTypeClass, errorClass),
            };
        }
        if (isMergeStatementType(valueTypeClass)) {
            statement = {
                type: 'merge',
                statement: mergeStatementConvert(valueTypeClass, errorClass),
            };
        }
        if (isRunAsStatementType(valueTypeClass)) {
            statement = {
                type: 'runAs',
                statement: runAsStatementConvert(valueTypeClass, errorClass),
            };
        }
        if (isLocalVariableDeclarationStatementType(valueTypeClass)) {
            return {
                type: 'localVariable',
                statement: localVariableDeclarationStatementConvert(valueTypeClass, errorClass),
            };
        }
        if (isExpressionStatementType(valueTypeClass)) {
            statement = { type: 'expression' };

            const value = expressionStatementConvert(valueTypeClass, errorClass);
            if (value) {
                statement.statement = value;
            }
        }
    }

    return statement;
};
