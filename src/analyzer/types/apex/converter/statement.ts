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
import {
    ExpressionClass,
    isExpressionClass,
    expressionConvert,
    parExpressionConvert,
} from './expression';
import { expressionListConvert } from './list';
import { qualifiedNameConvert } from './name';
import { finallyBlockConvert, normalBlockConvert } from './block';
import { CatchClauseClass, catchClauseConvert } from './clause';
import {
    ForControlClass,
    WhenControlClass,
    forControlConvert,
    whenControlConvert,
} from './control';
import { LocalVariableDeclarationClass, localVariableDeclarationConvert } from './declaration';

export const accessLevelConvert = (
    target: AccessLevelTypeClass,
    errorClass: ErrorTypeClass[],
): string | null => {
    return toPrimitiveValue(
        target.getValue(),
        (target): target is string => typeof target === 'string',
        errorClass,
    );
};

export const breakStatementConvert = (
    target: BreakStatementTypeClass,
    errorClass: ErrorTypeClass[],
): string | null => {
    return toPrimitiveValue(
        target.getValue(),
        (target): target is string => typeof target === 'string',
        errorClass,
    );
};

export const continueStatementConvert = (
    target: ContinueStatementTypeClass,
    errorClass: ErrorTypeClass[],
): string | null => {
    return toPrimitiveValue(
        target.getValue(),
        (target): target is string => typeof target === 'string',
        errorClass,
    );
};

export class DmlStatementClass extends CommonClass {
    private value: ExpressionClass = new ExpressionClass();
    private accessLevel: string | null = null;

    setValue(value: ExpressionClass): void {
        this.value.copy(value);
    }

    setAccessLevel(accessLevel: string | null) {
        this.accessLevel = accessLevel;
    }

    getValue(): ExpressionClass {
        return this.value;
    }

    getAccessLevel(): string | null {
        return this.accessLevel;
    }

    copy(commonClass: DmlStatementClass): void {
        this.setValue(commonClass.getValue());
        this.setAccessLevel(commonClass.getAccessLevel());
    }
}

export const isDmlStatementClass = (target: any): target is DmlStatementClass => {
    return isCommonClass(target, DmlStatementClass);
};

export const isDmlStatementClassArray = (target: any): target is DmlStatementClass[] => {
    return Array.isArray(target) && target.every((t) => isDmlStatementClass(t));
};

export const insertStatementConvert = (
    target: InsertStatementTypeClass,
    errorClass: ErrorTypeClass[],
): DmlStatementClass => {
    const insertStatement = new DmlStatementClass();

    const valueTypeClass = toTypeClass(target.getValue(), isExpressionTypeAll, errorClass);
    if (valueTypeClass) {
        insertStatement.setValue(expressionConvert(valueTypeClass, errorClass));
    }

    const accessLevelTypeClass = target.getAccessLevel();
    if (accessLevelTypeClass) {
        const typeClass = toTypeClass(accessLevelTypeClass, isAccessLevelType, errorClass);
        if (typeClass) {
            const accessLevel = accessLevelConvert(typeClass, errorClass);
            if (accessLevel) {
                insertStatement.setAccessLevel(accessLevel);
            }
        }
    }

    return insertStatement;
};

export const updatetatementConvert = (
    target: UpdateStatementTypeClass,
    errorClass: ErrorTypeClass[],
): DmlStatementClass => {
    const updateStatement = new DmlStatementClass();

    const valueTypeClass = toTypeClass(target.getValue(), isExpressionTypeAll, errorClass);
    if (valueTypeClass) {
        updateStatement.setValue(expressionConvert(valueTypeClass, errorClass));
    }

    const accessLevelTypeClass = target.getAccessLevel();
    if (accessLevelTypeClass) {
        const typeClass = toTypeClass(accessLevelTypeClass, isAccessLevelType, errorClass);
        if (typeClass) {
            const accessLevel = accessLevelConvert(typeClass, errorClass);
            if (accessLevel) {
                updateStatement.setAccessLevel(accessLevel);
            }
        }
    }

    return updateStatement;
};

export const deletetatementConvert = (
    target: DeleteStatementTypeClass,
    errorClass: ErrorTypeClass[],
): DmlStatementClass => {
    const deleteStatement = new DmlStatementClass();

    const valueTypeClass = toTypeClass(target.getValue(), isExpressionTypeAll, errorClass);
    if (valueTypeClass) {
        deleteStatement.setValue(expressionConvert(valueTypeClass, errorClass));
    }

    const accessLevelTypeClass = target.getAccessLevel();
    if (accessLevelTypeClass) {
        const typeClass = toTypeClass(accessLevelTypeClass, isAccessLevelType, errorClass);
        if (typeClass) {
            const accessLevel = accessLevelConvert(typeClass, errorClass);
            if (accessLevel) {
                deleteStatement.setAccessLevel(accessLevel);
            }
        }
    }

    return deleteStatement;
};

export const undeletetatementConvert = (
    target: UndeleteStatementTypeClass,
    errorClass: ErrorTypeClass[],
): DmlStatementClass => {
    const undeleteStatement = new DmlStatementClass();

    const valueTypeClass = toTypeClass(target.getValue(), isExpressionTypeAll, errorClass);
    if (valueTypeClass) {
        undeleteStatement.setValue(expressionConvert(valueTypeClass, errorClass));
    }

    const accessLevelTypeClass = target.getAccessLevel();
    if (accessLevelTypeClass) {
        const typeClass = toTypeClass(accessLevelTypeClass, isAccessLevelType, errorClass);
        if (typeClass) {
            const accessLevel = accessLevelConvert(typeClass, errorClass);
            if (accessLevel) {
                undeleteStatement.setAccessLevel(accessLevel);
            }
        }
    }

    return undeleteStatement;
};

export class UpsertStatementClass extends CommonClass {
    private value: ExpressionClass = new ExpressionClass();
    private accessLevel: string | null = null;
    private key: string[] = [];

    setValue(value: ExpressionClass): void {
        this.value.copy(value);
    }

    setAccessLevel(accessLevel: string | null): void {
        this.accessLevel = accessLevel;
    }

    resetKey(): void {
        this.key = [];
    }

    setKey(key: string[]): void {
        this.key.push(...key);
    }

    getValue(): ExpressionClass {
        return this.value;
    }

    getAccessLevel(): string | null {
        return this.accessLevel;
    }

    getKey(): string[] {
        return this.key;
    }

    copy(commonClass: UpsertStatementClass): void {
        this.setValue(commonClass.getValue());
        this.setAccessLevel(commonClass.getAccessLevel());
        this.resetKey();
        this.setKey(commonClass.getKey());
    }
}

export const isUpsertStatementClass = (target: any): target is UpsertStatementClass => {
    return isCommonClass(target, UpsertStatementClass);
};

export const isUpsertStatementClassArray = (target: any): target is UpsertStatementClass[] => {
    return Array.isArray(target) && target.every((t) => isUpsertStatementClass(t));
};

export const upsertStatementConvert = (
    target: UpsertStatementTypeClass,
    errorClass: ErrorTypeClass[],
): UpsertStatementClass => {
    const upsertStatement = new UpsertStatementClass();

    const keyValue = target.getKey();
    if (keyValue) {
        const typeClass = toTypeClass(keyValue, isQualifiedNameType, errorClass);
        if (typeClass) {
            upsertStatement.setKey(qualifiedNameConvert(typeClass, errorClass));
        }
    }

    const valueTypeClass = toTypeClass(target.getValue(), isExpressionTypeAll, errorClass);
    if (valueTypeClass) {
        upsertStatement.setValue(expressionConvert(valueTypeClass, errorClass));
    }

    const accessLevelTypeClass = target.getAccessLevel();
    if (accessLevelTypeClass) {
        const typeClass = toTypeClass(accessLevelTypeClass, isAccessLevelType, errorClass);
        if (typeClass) {
            const accessLevel = accessLevelConvert(typeClass, errorClass);
            if (accessLevel) {
                upsertStatement.setAccessLevel(accessLevel);
            }
        }
    }

    return upsertStatement;
};

export class MergeStatementClass extends CommonClass {
    private value: ExpressionClass[] = [];
    private accessLevel: string | null = null;

    resetValue(): void {
        this.value = [];
    }

    setValue(value: ExpressionClass[]): void {
        this.value.push(...value);
    }

    setAccessLevel(accessLevel: string | null): void {
        this.accessLevel = accessLevel;
    }

    getValue(): ExpressionClass[] {
        return this.value;
    }

    getAccessLevel(): string | null {
        return this.accessLevel;
    }

    copy(commonClass: MergeStatementClass): void {
        this.resetValue();
        this.setValue(commonClass.getValue());
        this.setAccessLevel(commonClass.getAccessLevel());
    }
}

export const isMergeStatementClass = (target: any): target is MergeStatementClass => {
    return isCommonClass(target, MergeStatementClass);
};

export const isMergeStatementClassArray = (target: any): target is MergeStatementClass[] => {
    return (
        Array.isArray(target) &&
        target.every((t) => t instanceof CommonClass && isMergeStatementClass(t))
    );
};

export const mergeStatementConvert = (
    target: MergeStatementTypeClass,
    errorClass: ErrorTypeClass[],
): MergeStatementClass => {
    const mergeStatement = new MergeStatementClass();

    const values: ExpressionClass[] = [];
    target.getValue().forEach((item) => {
        const typeClass = toTypeClass(item, isExpressionTypeAll, errorClass);
        if (typeClass) {
            values.push(expressionConvert(typeClass, errorClass));
        }
    });
    mergeStatement.getValue();

    const accessLevelTypeClass = target.getAccessLevel();
    if (accessLevelTypeClass) {
        const typeClass = toTypeClass(accessLevelTypeClass, isAccessLevelType, errorClass);
        if (typeClass) {
            const accessLevel = accessLevelConvert(typeClass, errorClass);
            if (accessLevel) {
                mergeStatement.setAccessLevel(accessLevel);
            }
        }
    }

    return mergeStatement;
};

export class DoWhileStatementClass extends CommonClass {
    private value: ExpressionClass = new ExpressionClass();
    private block: NormalStatementClass[] = [];

    setValue(value: ExpressionClass): void {
        this.value.copy(value);
    }

    resetBlock(): void {
        this.block = [];
    }

    setBlock(block: NormalStatementClass[]): void {
        this.block.push(...block);
    }

    getValue(): ExpressionClass {
        return this.value;
    }

    getBlock(): NormalStatementClass[] {
        return this.block;
    }

    copy(commonClass: DoWhileStatementClass): void {
        this.setValue(commonClass.getValue());
        this.resetBlock();
        this.setBlock(commonClass.getBlock());
    }
}

export const isDoWhileStatementClass = (target: any): target is DoWhileStatementClass => {
    return isCommonClass(target, DoWhileStatementClass);
};

export const isDoWhileStatementClassArray = (target: any): target is DoWhileStatementClass[] => {
    return Array.isArray(target) && target.every((t) => isDoWhileStatementClass(t));
};

export const doWhileStatementConvert = (
    target: DoWhileStatementTypeClass,
    errorClass: ErrorTypeClass[],
): DoWhileStatementClass => {
    const doWhileStatement = new DoWhileStatementClass();

    const block: NormalStatementClass[] = [];
    const blockTypeClass = toTypeClass(target.getBlock(), isNormalBlockType, errorClass);
    if (blockTypeClass) {
        block.push(...normalBlockConvert(blockTypeClass, errorClass));
    }
    doWhileStatement.setBlock(block);

    const valueTypeClass = toTypeClass(target.getValue(), isParExpressionType, errorClass);
    if (valueTypeClass) {
        doWhileStatement.setValue(parExpressionConvert(valueTypeClass, errorClass));
    }

    return doWhileStatement;
};

export const expressionStatementConvert = (
    target: ExpressionStatementTypeClass,
    errorClass: ErrorTypeClass[],
): ExpressionClass => {
    const expressionClass = new ExpressionClass();

    const valueTypeClass = toTypeClass(target.getValue(), isExpressionTypeAll, errorClass);
    if (valueTypeClass) {
        expressionClass.copy(expressionConvert(valueTypeClass, errorClass));
    }

    return expressionClass;
};

export class ForStatementClass extends CommonClass {
    private value: ForControlClass = new ForControlClass();
    private block: NormalStatementClass = new NormalStatementClass();

    setValue(value: ForControlClass): void {
        this.value.copy(value);
    }

    setBlock(block: NormalStatementClass): void {
        this.block.copy(block);
    }

    getValue(): ForControlClass {
        return this.value;
    }

    getBlock(): NormalStatementClass {
        return this.block;
    }

    copy(commonClass: ForStatementClass): void {
        this.setValue(commonClass.getValue());
        this.setBlock(commonClass.getBlock());
    }
}

export const isForStatementClass = (target: any): target is ForStatementClass => {
    return isCommonClass(target, ForStatementClass);
};

export const isForStatementClassArray = (target: any): target is ForStatementClass[] => {
    return Array.isArray(target) && target.every((t) => isForStatementClass(t));
};

export const forStatementConvert = (
    target: ForStatementTypeClass,
    errorClass: ErrorTypeClass[],
): ForStatementClass => {
    const forStatement = new ForStatementClass();

    const valueTypeClass = toTypeClass(target.getValue(), isForControlType, errorClass);
    if (valueTypeClass) {
        forStatement.setValue(forControlConvert(valueTypeClass, errorClass));
    }

    const blockTypeClass = toTypeClass(target.getBlock(), isNormalStatementType, errorClass);
    if (blockTypeClass) {
        forStatement.setBlock(normalStatementConvert(blockTypeClass, errorClass));
    }

    return forStatement;
};

export class IfStatementClass extends CommonClass {
    private value: string | ExpressionClass | null = null;
    private block: NormalStatementClass = new NormalStatementClass();

    setValue(value: string | ExpressionClass | null): void {
        if (
            this.value instanceof CommonClass &&
            isExpressionClass(this.value) &&
            value instanceof CommonClass &&
            isExpressionClass(value)
        ) {
            this.value.copy(value);
        } else {
            this.value = value;
        }
    }

    setBlock(block: NormalStatementClass): void {
        this.block.copy(block);
    }

    getValue(): string | ExpressionClass | null {
        return this.value;
    }

    getBlock(): NormalStatementClass {
        return this.block;
    }

    copy(commonClass: IfStatementClass): void {
        this.setValue(commonClass.getValue());
        this.setBlock(commonClass.getBlock());
    }
}

export const isIfStatementClass = (target: any): target is IfStatementClass => {
    return isCommonClass(target, IfStatementClass);
};

export const isIfStatementClassArray = (target: any): target is IfStatementClass[] => {
    return Array.isArray(target) && target.every((t) => isIfStatementClass(t));
};

export const ifStatementConvert = (
    target: IfStatementTypeClass,
    errorClass: ErrorTypeClass[],
): IfStatementClass[] => {
    const value = target.getValue();

    if (!Array.isArray(value)) {
        errorClass.push(value);
        return [];
    }

    const values: IfStatementClass[] = [];

    value.forEach((item) => {
        const ifStatementBlock = new IfStatementClass();

        const value = item.value;
        if (typeof value === 'string') {
            ifStatementBlock.setValue(value);
        } else {
            const valueTypeClass = toTypeClass(value, isParExpressionType, errorClass);
            if (valueTypeClass) {
                ifStatementBlock.setValue(parExpressionConvert(valueTypeClass, errorClass));
            }
        }

        const blockTypeClass = toTypeClass(item.block, isNormalStatementType, errorClass);
        if (blockTypeClass) {
            ifStatementBlock.setBlock(normalStatementConvert(blockTypeClass, errorClass));
        }

        values.push(ifStatementBlock);
    });

    return values;
};

export const localVariableDeclarationStatementConvert = (
    target: LocalVariableDeclarationStatementTypeClass,
    errorClass: ErrorTypeClass[],
): LocalVariableDeclarationClass => {
    const localVariableDeclarationStatement = new LocalVariableDeclarationClass();

    const valueTypeClass = toTypeClass(
        target.getValue(),
        isLocalVariableDeclarationType,
        errorClass,
    );
    if (valueTypeClass) {
        localVariableDeclarationStatement.copy(
            localVariableDeclarationConvert(valueTypeClass, errorClass),
        );
    }

    return localVariableDeclarationStatement;
};

export const returnStatementConvert = (
    target: ReturnStatementTypeClass,
    errorClass: ErrorTypeClass[],
): ExpressionClass => {
    const returnStatement = new ExpressionClass();

    const value = target.getValue();
    if (value) {
        const valueTypeClass = toTypeClass(value, isExpressionTypeAll, errorClass);
        if (valueTypeClass) {
            returnStatement.copy(expressionConvert(valueTypeClass, errorClass));
        }
    }

    return returnStatement;
};

export class RunAsStatementClass extends CommonClass {
    private value: ExpressionClass[] = [];
    private block: NormalStatementClass[] = [];

    resetValue(): void {
        this.value = [];
    }

    setValue(value: ExpressionClass[]): void {
        this.value.push(...value);
    }

    resetBlock(): void {
        this.block = [];
    }

    setBlock(block: NormalStatementClass[]): void {
        this.block.push(...block);
    }

    getValue(): ExpressionClass[] {
        return this.value;
    }

    getBlock(): NormalStatementClass[] {
        return this.block;
    }

    copy(commonClass: RunAsStatementClass): void {
        this.resetValue();
        this.setValue(commonClass.getValue());
        this.resetBlock();
        this.setBlock(commonClass.getBlock());
    }
}

export const isRunAsStatementClass = (target: any): target is RunAsStatementClass => {
    return isCommonClass(target, RunAsStatementClass);
};

export const isRunAsStatementClassArray = (target: any): target is RunAsStatementClass[] => {
    return Array.isArray(target) && target.every((t) => isRunAsStatementClass(t));
};

export const runAsStatementConvert = (
    target: RunAsStatementTypeClass,
    errorClass: ErrorTypeClass[],
): RunAsStatementClass => {
    const runAsStatement = new RunAsStatementClass();

    const value: ExpressionClass[] = [];
    const valueTypeClass = toTypeClass(target.getValue(), isExpressionListType, errorClass);
    if (valueTypeClass) {
        value.push(...expressionListConvert(valueTypeClass, errorClass));
    }
    runAsStatement.setValue(value);

    const block: NormalStatementClass[] = [];
    const blockTypeClass = toTypeClass(target.getBlock(), isNormalBlockType, errorClass);
    if (blockTypeClass) {
        block.push(...normalBlockConvert(blockTypeClass, errorClass));
    }
    runAsStatement.setBlock(block);

    return runAsStatement;
};

export class SwitchStatementClass extends CommonClass {
    private value: ExpressionClass = new ExpressionClass();
    private block: WhenControlClass[] = [];

    setValue(value: ExpressionClass): void {
        this.value.copy(value);
    }

    resetBlock(): void {
        this.block = [];
    }

    setBlock(block: WhenControlClass[]): void {
        this.block.push(...block);
    }

    getValue(): ExpressionClass {
        return this.value;
    }

    getBlock(): WhenControlClass[] {
        return this.block;
    }

    copy(commonClass: SwitchStatementClass): void {
        this.setValue(commonClass.getValue());
        this.resetBlock();
        this.setBlock(commonClass.getBlock());
    }
}

export const isSwitchStatementClass = (target: any): target is SwitchStatementClass => {
    return isCommonClass(target, SwitchStatementClass);
};

export const isSwitchStatementClassArray = (target: any): target is SwitchStatementClass[] => {
    return Array.isArray(target) && target.every((t) => isSwitchStatementClass(t));
};

export const switchStatementConvert = (
    target: SwitchStatementTypeClass,
    errorClass: ErrorTypeClass[],
): SwitchStatementClass => {
    const switchStatement = new SwitchStatementClass();

    const block: WhenControlClass[] = [];
    target.getBlocks().forEach((item) => {
        const whenTypeClass = toTypeClass(item, isWhenControlType, errorClass);
        if (whenTypeClass) {
            block.push(whenControlConvert(whenTypeClass, errorClass));
        }
    });
    switchStatement.setBlock(block);

    const valueTypeClass = toTypeClass(target.getValue(), isExpressionTypeAll, errorClass);
    if (valueTypeClass) {
        switchStatement.setValue(expressionConvert(valueTypeClass, errorClass));
    }

    return switchStatement;
};

export const throwStatementConvert = (
    target: ThrowStatementTypeClass,
    errorClass: ErrorTypeClass[],
): ExpressionClass => {
    const throwStatement = new ExpressionClass();

    const value = target.getValue();
    if (value) {
        const valueTypeClass = toTypeClass(value, isExpressionTypeAll, errorClass);
        if (valueTypeClass) {
            throwStatement.copy(expressionConvert(valueTypeClass, errorClass));
        }
    }

    return throwStatement;
};

export class TryStatementClass extends CommonClass {
    private value: NormalStatementClass[] = [];
    private catchBlock: CatchClauseClass[] = [];
    private finallyBlock: NormalStatementClass[] = [];

    resetValue(): void {
        this.value = [];
    }

    setValue(value: NormalStatementClass[]) {
        this.value.push(...value);
    }

    resetCatchBlock(): void {
        this.catchBlock = [];
    }

    setCatchBlock(catchBlock: CatchClauseClass[]) {
        this.catchBlock.push(...catchBlock);
    }

    resetFinallyBlock(): void {
        this.finallyBlock = [];
    }

    setFinallyBlock(finallyBlock: NormalStatementClass[]) {
        this.finallyBlock.push(...finallyBlock);
    }

    getValue(): NormalStatementClass[] {
        return this.value;
    }

    getCatchBlock(): CatchClauseClass[] {
        return this.catchBlock;
    }

    getFinallyBlock(): NormalStatementClass[] {
        return this.finallyBlock;
    }

    copy(commonClass: TryStatementClass): void {
        this.resetValue();
        this.setValue(commonClass.getValue());
        this.resetCatchBlock();
        this.setCatchBlock(commonClass.getCatchBlock());
        this.resetFinallyBlock();
        this.setFinallyBlock(commonClass.getFinallyBlock());
    }
}

export const isTryStatementClass = (target: any): target is TryStatementClass => {
    return isCommonClass(target, TryStatementClass);
};

export const isTryStatementClassArray = (target: any): target is TryStatementClass[] => {
    return Array.isArray(target) && target.every((t) => isTryStatementClass(t));
};

export const tryStatementConvert = (
    target: TryStatementTypeClass,
    errorClass: ErrorTypeClass[],
): TryStatementClass => {
    const tryStatement = new TryStatementClass();

    const value: NormalStatementClass[] = [];
    const valueTypeClass = toTypeClass(target.getValue(), isNormalBlockType, errorClass);
    if (valueTypeClass) {
        value.push(...normalBlockConvert(valueTypeClass, errorClass));
    }
    tryStatement.setValue(value);

    const catchBlock: CatchClauseClass[] = [];
    target.getCatchBlock().forEach((item) => {
        const catchTypeClass = toTypeClass(item, isCatchClauseType, errorClass);
        if (catchTypeClass) {
            catchBlock.push(catchClauseConvert(catchTypeClass, errorClass));
        }
    });
    tryStatement.setCatchBlock(catchBlock);

    const finallyBlock: NormalStatementClass[] = [];
    const finallyValue = target.getFinallyBlock();
    if (finallyValue) {
        const finallyTypeClass = toTypeClass(finallyValue, isFinallyBlockType, errorClass);
        if (finallyTypeClass) {
            finallyBlock.push(...finallyBlockConvert(finallyTypeClass, errorClass));
        }
    }
    tryStatement.setFinallyBlock(finallyBlock);

    return tryStatement;
};

export class WhileStatementClass extends CommonClass {
    private value: ExpressionClass = new ExpressionClass();
    private block: NormalStatementClass = new NormalStatementClass();

    setValue(value: ExpressionClass): void {
        this.value.copy(value);
    }

    setBlock(block: NormalStatementClass) {
        this.block.copy(block);
    }

    getValue(): ExpressionClass {
        return this.value;
    }

    getBlock(): NormalStatementClass {
        return this.block;
    }

    copy(commonClass: WhileStatementClass): void {
        this.setValue(commonClass.getValue());
        this.setBlock(commonClass.getBlock());
    }
}

export const isWhileStatementClass = (target: any): target is WhileStatementClass => {
    return isCommonClass(target, WhileStatementClass);
};

export const isWhileStatementClassArray = (target: any): target is WhileStatementClass[] => {
    return Array.isArray(target) && target.every((t) => isWhileStatementClass(t));
};

export const whileStatementConvert = (
    target: WhileStatementTypeClass,
    errorClass: ErrorTypeClass[],
): WhileStatementClass => {
    const whileStatement = new WhileStatementClass();

    const valueTypeClass = toTypeClass(target.getValue(), isParExpressionType, errorClass);
    if (valueTypeClass) {
        whileStatement.setValue(parExpressionConvert(valueTypeClass, errorClass));
    }

    const blockTypeClass = toTypeClass(target.getBlock(), isNormalStatementType, errorClass);
    if (blockTypeClass) {
        whileStatement.setBlock(normalStatementConvert(blockTypeClass, errorClass));
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

export class BlockStatementElementClass extends StatementElementClass<
    'block',
    NormalStatementClass[]
> {
    constructor(statement: NormalStatementClass[]) {
        super('block', statement);
    }
}

export const isBlockStatementElementClass = (
    target: CommonClass,
): target is BlockStatementElementClass => {
    return isCommonClass(target, BlockStatementElementClass);
};

export class IfStatementElementClass extends StatementElementClass<'if', IfStatementClass[]> {
    constructor(statement: IfStatementClass[]) {
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
    ExpressionClass
> {
    constructor(type: 'return' | 'expression' | 'throw', statement: ExpressionClass) {
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
    RunAsStatementClass
> {
    constructor(statement: RunAsStatementClass) {
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
    LocalVariableDeclarationClass
> {
    constructor(statement: LocalVariableDeclarationClass) {
        super('localVariable', statement);
    }
}

export const isLocalVariableStatementElementClass = (
    target: CommonClass,
): target is LocalVariableStatementElementClass => {
    return isCommonClass(target, LocalVariableStatementElementClass);
};

export class NormalStatementClass extends CommonClass {
    private value:
        | BlockStatementElementClass
        | IfStatementElementClass
        | SwitchStatementElementClass
        | ForStatementElementClass
        | WhileStatementElementClass
        | DoWhileStatementElementClass
        | TryStatementElementClass
        | ExpressionStatementElementClass
        | StringStatementElementClass
        | DmlStatementElementClass
        | UpsertStatementElementClass
        | MergeStatementElementClass
        | RunAsStatementElementClass
        | LocalVariableStatementElementClass
        | null = null;

    setValue(
        value:
            | BlockStatementElementClass
            | IfStatementElementClass
            | SwitchStatementElementClass
            | ForStatementElementClass
            | WhileStatementElementClass
            | DoWhileStatementElementClass
            | TryStatementElementClass
            | ExpressionStatementElementClass
            | StringStatementElementClass
            | DmlStatementElementClass
            | UpsertStatementElementClass
            | MergeStatementElementClass
            | RunAsStatementElementClass
            | LocalVariableStatementElementClass
            | null,
    ): void {
        this.value = value;
    }

    getValue():
        | BlockStatementElementClass
        | IfStatementElementClass
        | SwitchStatementElementClass
        | ForStatementElementClass
        | WhileStatementElementClass
        | DoWhileStatementElementClass
        | TryStatementElementClass
        | ExpressionStatementElementClass
        | StringStatementElementClass
        | DmlStatementElementClass
        | UpsertStatementElementClass
        | MergeStatementElementClass
        | RunAsStatementElementClass
        | LocalVariableStatementElementClass
        | null {
        return this.value;
    }

    copy(commonClass: NormalStatementClass): void {
        this.setValue(commonClass.getValue());
    }
}

export const isNormalStatementClass = (target: any): target is NormalStatementClass => {
    return isCommonClass(target, NormalStatementClass);
};

export const isNormalStatementClassArray = (target: any): target is NormalStatementClass[] => {
    return Array.isArray(target) && target.every((t) => isNormalStatementClass(t));
};

export const normalStatementConvert = (
    target: NormalStatementTypeClass,
    errorClass: ErrorTypeClass[],
): NormalStatementClass => {
    const valueTypeClass = toTypeClass(target.getValue(), isStatementTypeAll, errorClass);

    const normalStatement = new NormalStatementClass();

    if (valueTypeClass) {
        if (isNormalBlockType(valueTypeClass)) {
            normalStatement.setValue(
                new BlockStatementElementClass(normalBlockConvert(valueTypeClass, errorClass)),
            );
        }
        if (isIfStatementType(valueTypeClass)) {
            normalStatement.setValue(
                new IfStatementElementClass(ifStatementConvert(valueTypeClass, errorClass)),
            );
        }

        if (isSwitchStatementType(valueTypeClass)) {
            normalStatement.setValue(
                new SwitchStatementElementClass(switchStatementConvert(valueTypeClass, errorClass)),
            );
        }
        if (isForStatementType(valueTypeClass)) {
            normalStatement.setValue(
                new ForStatementElementClass(forStatementConvert(valueTypeClass, errorClass)),
            );
        }
        if (isWhileStatementType(valueTypeClass)) {
            normalStatement.setValue(
                new WhileStatementElementClass(whileStatementConvert(valueTypeClass, errorClass)),
            );
        }
        if (isDoWhileStatementType(valueTypeClass)) {
            normalStatement.setValue(
                new DoWhileStatementElementClass(
                    doWhileStatementConvert(valueTypeClass, errorClass),
                ),
            );
        }
        if (isTryStatementType(valueTypeClass)) {
            normalStatement.setValue(
                new TryStatementElementClass(tryStatementConvert(valueTypeClass, errorClass)),
            );
        }
        if (isReturnStatementType(valueTypeClass)) {
            normalStatement.setValue(
                new ExpressionStatementElementClass(
                    'return',
                    returnStatementConvert(valueTypeClass, errorClass),
                ),
            );
        }
        if (isThrowStatementType(valueTypeClass)) {
            normalStatement.setValue(
                new ExpressionStatementElementClass(
                    'throw',
                    returnStatementConvert(valueTypeClass, errorClass),
                ),
            );
        }
        if (isBreakStatementType(valueTypeClass)) {
            normalStatement.setValue(
                new StringStatementElementClass(
                    'break',
                    breakStatementConvert(valueTypeClass, errorClass),
                ),
            );
        }
        if (isContinueStatementType(valueTypeClass)) {
            normalStatement.setValue(
                new StringStatementElementClass(
                    'continue',
                    breakStatementConvert(valueTypeClass, errorClass),
                ),
            );
        }
        if (isInsertStatementType(valueTypeClass)) {
            normalStatement.setValue(
                new DmlStatementElementClass(
                    'insert',
                    insertStatementConvert(valueTypeClass, errorClass),
                ),
            );
        }
        if (isUpdateStatementType(valueTypeClass)) {
            normalStatement.setValue(
                new DmlStatementElementClass(
                    'update',
                    updatetatementConvert(valueTypeClass, errorClass),
                ),
            );
        }
        if (isDeleteStatementType(valueTypeClass)) {
            normalStatement.setValue(
                new DmlStatementElementClass(
                    'delete',
                    deletetatementConvert(valueTypeClass, errorClass),
                ),
            );
        }
        if (isUndeleteStatementType(valueTypeClass)) {
            normalStatement.setValue(
                new DmlStatementElementClass(
                    'undelete',
                    undeletetatementConvert(valueTypeClass, errorClass),
                ),
            );
        }
        if (isUpsertStatementType(valueTypeClass)) {
            normalStatement.setValue(
                new UpsertStatementElementClass(upsertStatementConvert(valueTypeClass, errorClass)),
            );
        }
        if (isMergeStatementType(valueTypeClass)) {
            normalStatement.setValue(
                new MergeStatementElementClass(mergeStatementConvert(valueTypeClass, errorClass)),
            );
        }
        if (isRunAsStatementType(valueTypeClass)) {
            normalStatement.setValue(
                new RunAsStatementElementClass(runAsStatementConvert(valueTypeClass, errorClass)),
            );
        }
        if (isLocalVariableDeclarationStatementType(valueTypeClass)) {
            normalStatement.setValue(
                new LocalVariableStatementElementClass(
                    localVariableDeclarationStatementConvert(valueTypeClass, errorClass),
                ),
            );
        }
        if (isExpressionStatementType(valueTypeClass)) {
            normalStatement.setValue(
                new ExpressionStatementElementClass(
                    'expression',
                    expressionStatementConvert(valueTypeClass, errorClass),
                ),
            );
        }
    }

    return normalStatement;
};
