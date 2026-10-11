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

import { toPrimitiveValue, toTypeClass, CommonClass, isCommonClass } from './commons';
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

export class DmlStatementClass extends CommonClass {
    private value: Expression | null;
    private accessLevel: string | null;

    constructor(value: Expression | null, accessLevel: string | null) {
        super();
        this.value = value;
        this.accessLevel = accessLevel;
    }

    getValue(): Expression | null {
        return this.value;
    }

    getAccessLevel(): string | null {
        return this.accessLevel;
    }
}

export const isDmlStatementClass = (target: CommonClass): target is DmlStatementClass => {
    return isCommonClass(target, DmlStatementClass);
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

export class UpsertStatementClass extends CommonClass {
    private value: Expression | null;
    private accessLevel: string | null;
    private key: string[];

    constructor(value: Expression | null, accessLevel: string | null, key: string[]) {
        super();
        this.value = value;
        this.accessLevel = accessLevel;
        this.key = key;
    }

    getValue(): Expression | null {
        return this.value;
    }

    getAccessLevel(): string | null {
        return this.accessLevel;
    }

    getKey(): string[] {
        return this.key;
    }
}

export const isUpsertStatementClass = (target: CommonClass): target is UpsertStatementClass => {
    return isCommonClass(target, UpsertStatementClass);
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

export class MergeStatementClass extends CommonClass {
    private value: Expression[];
    private accessLevel: string | null;

    constructor(value: Expression[], accessLevel: string | null) {
        super();
        this.value = value;
        this.accessLevel = accessLevel;
    }

    getValue(): Expression[] {
        return this.value;
    }

    getAccessLevel(): string | null {
        return this.accessLevel;
    }
}

export const isMergeStatementClass = (target: CommonClass): target is MergeStatementClass => {
    return isCommonClass(target, MergeStatementClass);
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

export class DoWhileStatementClass extends CommonClass {
    private value: Expression | null;
    private block: NormalStatement[];

    constructor(value: Expression | null, block: NormalStatement[]) {
        super();
        this.value = value;
        this.block = block;
    }

    getValue(): Expression | null {
        return this.value;
    }

    getBlock(): NormalStatement[] {
        return this.block;
    }
}

export const isDoWhileStatementClass = (target: CommonClass): target is DoWhileStatementClass => {
    return isCommonClass(target, DoWhileStatementClass);
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

export class ForStatementClass extends CommonClass {
    private value: ForControl;
    private block: NormalStatement | null;

    constructor(value: ForControl, block: NormalStatement | null) {
        super();
        this.value = value;
        this.block = block;
    }

    getValue(): ForControl {
        return this.value;
    }

    getBlock(): NormalStatement | null {
        return this.block;
    }
}

export const isForStatementClass = (target: CommonClass): target is ForStatementClass => {
    return isCommonClass(target, ForStatementClass);
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

export class IfStatementClass extends CommonClass {
    private value: Expression | null;
    private block: NormalStatement | null;

    constructor(value: Expression | null, block: NormalStatement | null) {
        super();
        this.value = value;
        this.block = block;
    }

    getValue(): Expression | null {
        return this.value;
    }

    getBlock(): NormalStatement | null {
        return this.block;
    }
}

export const isIfStatementClass = (target: CommonClass): target is IfStatementClass => {
    return isCommonClass(target, IfStatementClass);
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

export class RunAsStatementClass extends CommonClass {
    private value: Expression[];
    private block: NormalStatement[];

    constructor(value: Expression[], block: NormalStatement[]) {
        super();
        this.value = value;
        this.block = block;
    }

    getValue(): Expression[] {
        return this.value;
    }

    getBlock(): NormalStatement[] {
        return this.block;
    }
}

export const isRunAsStatementClass = (target: CommonClass): target is RunAsStatementClass => {
    return isCommonClass(target, RunAsStatementClass);
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

export class SwitchStatementClass extends CommonClass {
    private value: Expression | null;
    private block: WhenControl[];

    constructor(value: Expression | null, block: WhenControl[]) {
        super();
        this.value = value;
        this.block = block;
    }

    getValue(): Expression | null {
        return this.value;
    }

    getBlock(): WhenControl[] {
        return this.block;
    }
}

export const isSwitchStatementClass = (target: CommonClass): target is SwitchStatementClass => {
    return isCommonClass(target, SwitchStatementClass);
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

export class TryStatementClass extends CommonClass {
    private value: NormalStatement[];
    private catchBlock: CatchClause[];
    private finallyBlock: NormalStatement[];

    constructor(
        value: NormalStatement[],
        catchBlock: CatchClause[],
        finallyBlock: NormalStatement[],
    ) {
        super();
        this.value = value;
        this.catchBlock = catchBlock;
        this.finallyBlock = finallyBlock;
    }

    getValue(): NormalStatement[] {
        return this.value;
    }

    getCatchBlock(): CatchClause[] {
        return this.catchBlock;
    }

    getFinallyBlock(): NormalStatement[] {
        return this.finallyBlock;
    }
}

export const isTryStatementClass = (target: CommonClass): target is TryStatementClass => {
    return isCommonClass(target, TryStatementClass);
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

export class WhileStatementClass extends CommonClass {
    private value: Expression | null;
    private block: NormalStatement | null;

    constructor(value: Expression | null, block: NormalStatement | null) {
        super();
        this.value = value;
        this.block = block;
    }

    getValue(): Expression | null {
        return this.value;
    }

    getBlock(): NormalStatement | null {
        return this.block;
    }
}

export const isWhileStatementClass = (target: CommonClass): target is WhileStatementClass => {
    return isCommonClass(target, WhileStatementClass);
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

export abstract class StatementElementClass<TType, TStatement> extends CommonClass {
    private type: TType;
    private statement: TStatement;

    constructor(type: TType, statement: TStatement) {
        super();
        this.type = type;
        this.statement = statement;
    }

    getType(): TType {
        return this.type;
    }

    getStatement(): TStatement {
        return this.statement;
    }
}

export const isStatementElementClass = (
    target: CommonClass,
): target is StatementElementClass<unknown, unknown> => {
    return isCommonClass(target, StatementElementClass);
};

export class BlockStatementElementClass extends StatementElementClass<'block', NormalStatement[]> {
    constructor(statement: NormalStatement[]) {
        super('block', statement);
    }
}

export const isBlockStatementElementClass = (
    target: CommonClass,
): target is BlockStatementElementClass => {
    return isCommonClass(target, BlockStatementElementClass);
};

export class IfStatementElementClass extends StatementElementClass<'if', IfStatementClass> {
    constructor(statement: IfStatementClass) {
        super('if', statement);
    }
}

export const isIfStatementElementClass = (
    target: CommonClass,
): target is IfStatementElementClass => {
    return isCommonClass(target, IfStatementElementClass);
};

export class SwitchStatementElementClass extends StatementElementClass<
    'switch',
    SwitchStatementClass
> {
    constructor(statement: SwitchStatementClass) {
        super('switch', statement);
    }
}

export const isSwitchStatementElementClass = (
    target: CommonClass,
): target is SwitchStatementElementClass => {
    return isCommonClass(target, SwitchStatementElementClass);
};

export class ForStatementElementClass extends StatementElementClass<'for', ForStatementClass> {
    constructor(statement: ForStatementClass) {
        super('for', statement);
    }
}

export const isForStatementElementClass = (
    target: CommonClass,
): target is ForStatementElementClass => {
    return isCommonClass(target, ForStatementElementClass);
};

export class WhileStatementElementClass extends StatementElementClass<
    'while',
    WhileStatementClass
> {
    constructor(statement: WhileStatementClass) {
        super('while', statement);
    }
}

export const isWhileStatementElementClass = (
    target: CommonClass,
): target is WhileStatementElementClass => {
    return isCommonClass(target, WhileStatementElementClass);
};

export class DoWhileStatementElementClass extends StatementElementClass<
    'doWhile',
    DoWhileStatementClass
> {
    constructor(statement: DoWhileStatementClass) {
        super('doWhile', statement);
    }
}

export const isDoWhileStatementElementClass = (
    target: CommonClass,
): target is DoWhileStatementElementClass => {
    return isCommonClass(target, DoWhileStatementElementClass);
};

export class TryStatementElementClass extends StatementElementClass<'try', TryStatementClass> {
    constructor(statement: TryStatementClass) {
        super('try', statement);
    }
}

export const isTryStatementElementClass = (
    target: CommonClass,
): target is TryStatementElementClass => {
    return isCommonClass(target, TryStatementElementClass);
};

export class ExpressionStatementElementClass extends StatementElementClass<
    'return' | 'expression' | 'throw',
    Expression | null
> {
    constructor(type: 'return' | 'expression' | 'throw', statement: Expression | null) {
        super(type, statement);
    }
}

export const isExpressionStatementElementClass = (
    target: CommonClass,
): target is ExpressionStatementElementClass => {
    return isCommonClass(target, ExpressionStatementElementClass);
};

export class StringStatementElementClass extends StatementElementClass<
    'break' | 'continue',
    string | null
> {
    constructor(type: 'break' | 'continue', statement: string | null) {
        super(type, statement);
    }
}

export const isStringStatementElementClass = (
    target: CommonClass,
): target is StringStatementElementClass => {
    return isCommonClass(target, StringStatementElementClass);
};

export class DmlStatementElementClass extends StatementElementClass<
    'insert' | 'update' | 'delete' | 'undelete',
    DmlStatementClass
> {
    constructor(type: 'insert' | 'update' | 'delete' | 'undelete', statement: DmlStatementClass) {
        super(type, statement);
    }
}

export const isDmlStatementElementClass = (
    target: CommonClass,
): target is DmlStatementElementClass => {
    return isCommonClass(target, DmlStatementElementClass);
};

export class UpsertStatementElementClass extends StatementElementClass<
    'upsert',
    UpsertStatementClass
> {
    constructor(statement: UpsertStatementClass) {
        super('upsert', statement);
    }
}

export const isUpsertStatementElementClass = (
    target: CommonClass,
): target is UpsertStatementElementClass => {
    return isCommonClass(target, UpsertStatementElementClass);
};

export class MergeStatementElementClass extends StatementElementClass<
    'merge',
    MergeStatementClass
> {
    constructor(statement: MergeStatementClass) {
        super('merge', statement);
    }
}

export const isMergeStatementElementClass = (
    target: CommonClass,
): target is MergeStatementElementClass => {
    return isCommonClass(target, MergeStatementElementClass);
};

export class RunAsStatementElementClass extends StatementElementClass<
    'runAs',
    RunAsStatementElementClass
> {
    constructor(statement: RunAsStatementElementClass) {
        super('runAs', statement);
    }
}

export const isRunAsStatementElementClass = (
    target: CommonClass,
): target is RunAsStatementElementClass => {
    return isCommonClass(target, RunAsStatementElementClass);
};

export class LocalVariableStatementElementClass extends StatementElementClass<
    'localVariable',
    LocalVariableDeclaration
> {
    constructor(statement: LocalVariableDeclaration) {
        super('localVariable', statement);
    }
}

export const isLocalVariableStatementElementClass = (
    target: CommonClass,
): target is LocalVariableStatementElementClass => {
    return isCommonClass(target, LocalVariableStatementElementClass);
};

export class NormalStatementClass extends CommonClass {
    private value: StatementElementClass<unknown, unknown>;

    constructor(value: StatementElementClass<unknown, unknown>) {
        super();
        this.value = value;
    }

    getValue(): StatementElementClass<unknown, unknown> {
        return this.value;
    }
}

export const isNormalStatementClass = (target: CommonClass): target is NormalStatementClass => {
    return isCommonClass(target, NormalStatementClass);
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
