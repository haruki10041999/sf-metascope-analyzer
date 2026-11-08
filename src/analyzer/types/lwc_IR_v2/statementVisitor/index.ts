import { LwcCommonTypeClass, LwcCommonVisitor, lazyPairs } from '../commonVisitor';
import { BlockStatementTypeClass, blockStatementTypePair } from '../commons/blockStatement';
import { BreakStatementTypeClass, breakStatementTypePair } from '../commons/breakStatement';
import {
    ContinueStatementTypeClass,
    continueStatementTypePair,
} from '../commons/continueStatement';
import {
    DebuggerStatementTypeClass,
    debuggerStatementTypePair,
} from '../commons/debuggerStatement';
import { DoWhileStatementTypeClass, doWhileStatementTypePair } from '../commons/doWhileStatement';
import { EmptyStatementTypeClass, emptyStatementTypePair } from '../commons/emptyStatement';
import {
    ExpressionStatementTypeClass,
    expressionStatementTypePair,
} from '../commons/expressionStatement';
import { ForInStatementTypeClass, forInStatementTypePair } from '../commons/forInStatement';
import { ForStatementTypeClass, forStatementTypePair } from '../commons/forStatement';
import {
    FunctionDeclarationTypeClass,
    functionDeclarationTypePair,
} from '../commons/functionDeclaration';
import { IfStatementTypeClass, ifStatementTypePair } from '../commons/ifStatement';
import { LabeledStatementTypeClass, labeledStatementTypePair } from '../commons/labeledStatement';
import { ReturnStatementTypeClass, returnStatementTypePair } from '../commons/returnStatement';
import { SwitchStatementTypeClass, switchStatementTypePair } from '../commons/switchStatement';
import { ThrowStatementTypeClass, throwStatementTypePair } from '../commons/throwStatement';
import { TryStatementTypeClass, tryStatementTypePair } from '../commons/tryStatement';
import {
    VariableDeclarationTypeClass,
    variableDeclarationTypePair,
} from '../commons/variableDeclaration';
import { WhileStatementTypeClass, whileStatementTypePair } from '../commons/whileStatement';
import { WithStatementTypeClass, withStatementTypePair } from '../commons/withStatement';
import { ClassDeclarationTypeClass, classDeclarationTypePair } from '../commons/classDeclaration';
import {
    ExportAllDeclarationTypeClass,
    exportAllDeclarationTypePair,
} from '../commons/exportAllDeclaration';
import {
    ExportDefaultDeclarationTypeClass,
    exportDefaultDeclarationTypePair,
} from '../commons/exportDefaultDeclaration';
import {
    ExportNamedDeclarationTypeClass,
    exportNamedDeclarationTypePair,
} from '../commons/exportNamedDeclaration';
import { ForOfStatementTypeClass, forOfStatementTypePair } from '../commons/forOfStatement';
import {
    ImportDeclarationTypeClass,
    importDeclarationTypePair,
} from '../commons/importDeclaration';
import { DeclareClassTypeClass, declareClassTypePair } from '../commons/declareClass';
import { DeclareFunctionTypeClass, declareFunctionTypePair } from '../commons/declareFunction';
import { DeclareInterfaceTypeClass, declareInterfaceTypePair } from '../commons/declareInterface';
import { DeclareModuleTypeClass, declareModuleTypePair } from '../commons/declareModule';
import {
    DeclareModuleExportsTypeClass,
    declareModuleExportsTypePair,
} from '../commons/declareModuleExports';
import { DeclareTypeAliasTypeClass, declareTypeAliasTypePair } from '../commons/declareTypeAlias';
import {
    DeclareOpaqueTypeTypeClass,
    declareOpaqueTypeTypePair,
} from '../commons/declareOpaqueType';
import { DeclareVariableTypeClass, declareVariableTypePair } from '../commons/declareVariable';
import {
    DeclareExportDeclarationTypeClass,
    declareExportDeclarationTypePair,
} from '../commons/declareExportDeclaration';
import {
    DeclareExportAllDeclarationTypeClass,
    declareExportAllDeclarationTypePair,
} from '../commons/declareExportAllDeclaration';
import {
    InterfaceDeclarationTypeClass,
    interfaceDeclarationTypePair,
} from '../commons/interfaceDeclaration';
import { OpaqueTypeTypeClass, opaqueTypeTypePair } from '../commons/opaqueType';
import { TypeAliasTypeClass, typeAliasTypePair } from '../commons/typeAlias';
import { EnumDeclarationTypeClass, enumDeclarationTypePair } from '../commons/enumDeclaration';
import {
    TSDeclareFunctionTypeClass,
    tSDeclareFunctionTypePair,
} from '../commons/tSDeclareFunction';
import {
    TSInterfaceDeclarationTypeClass,
    tSInterfaceDeclarationTypePair,
} from '../commons/tSInterfaceDeclaration';
import {
    TSTypeAliasDeclarationTypeClass,
    tSTypeAliasDeclarationTypePair,
} from '../commons/tSTypeAliasDeclaration';
import {
    TSEnumDeclarationTypeClass,
    tSEnumDeclarationTypePair,
} from '../commons/tSEnumDeclaration';
import {
    TSModuleDeclarationTypeClass,
    tSModuleDeclarationTypePair,
} from '../commons/tSModuleDeclaration';
import {
    TSImportEqualsDeclarationTypeClass,
    tSImportEqualsDeclarationTypePair,
} from '../commons/tSImportEqualsDeclaration';
import {
    TSExportAssignmentTypeClass,
    tSExportAssignmentTypePair,
} from '../commons/tSExportAssignment';
import {
    TSNamespaceExportDeclarationTypeClass,
    tSNamespaceExportDeclarationTypePair,
} from '../commons/tSNamespaceExportDeclaration';

export {
    BlockStatementTypeClass,
    blockStatementTypePair,
    isBlockStatementType,
} from '../commons/blockStatement';
export {
    BreakStatementTypeClass,
    breakStatementTypePair,
    isBreakStatementType,
} from '../commons/breakStatement';
export {
    ContinueStatementTypeClass,
    continueStatementTypePair,
    isContinueStatementType,
} from '../commons/continueStatement';
export {
    DebuggerStatementTypeClass,
    debuggerStatementTypePair,
    isDebuggerStatementType,
} from '../commons/debuggerStatement';
export {
    DoWhileStatementTypeClass,
    doWhileStatementTypePair,
    isDoWhileStatementType,
} from '../commons/doWhileStatement';
export {
    EmptyStatementTypeClass,
    emptyStatementTypePair,
    isEmptyStatementType,
} from '../commons/emptyStatement';
export {
    ExpressionStatementTypeClass,
    expressionStatementTypePair,
    isExpressionStatementType,
} from '../commons/expressionStatement';
export {
    ForInStatementTypeClass,
    forInStatementTypePair,
    isForInStatementType,
} from '../commons/forInStatement';
export {
    ForStatementTypeClass,
    forStatementTypePair,
    isForStatementType,
} from '../commons/forStatement';
export {
    FunctionDeclarationTypeClass,
    functionDeclarationTypePair,
    isFunctionDeclarationType,
} from '../commons/functionDeclaration';
export {
    IfStatementTypeClass,
    ifStatementTypePair,
    isIfStatementType,
} from '../commons/ifStatement';
export {
    LabeledStatementTypeClass,
    labeledStatementTypePair,
    isLabeledStatementType,
} from '../commons/labeledStatement';
export {
    ReturnStatementTypeClass,
    returnStatementTypePair,
    isReturnStatementType,
} from '../commons/returnStatement';
export {
    SwitchStatementTypeClass,
    switchStatementTypePair,
    isSwitchStatementType,
} from '../commons/switchStatement';
export {
    ThrowStatementTypeClass,
    throwStatementTypePair,
    isThrowStatementType,
} from '../commons/throwStatement';
export {
    TryStatementTypeClass,
    tryStatementTypePair,
    isTryStatementType,
} from '../commons/tryStatement';
export {
    VariableDeclarationTypeClass,
    variableDeclarationTypePair,
    isVariableDeclarationType,
} from '../commons/variableDeclaration';
export {
    WhileStatementTypeClass,
    whileStatementTypePair,
    isWhileStatementType,
} from '../commons/whileStatement';
export {
    WithStatementTypeClass,
    withStatementTypePair,
    isWithStatementType,
} from '../commons/withStatement';
export {
    ClassDeclarationTypeClass,
    classDeclarationTypePair,
    isClassDeclarationType,
} from '../commons/classDeclaration';
export {
    ExportAllDeclarationTypeClass,
    exportAllDeclarationTypePair,
    isExportAllDeclarationType,
} from '../commons/exportAllDeclaration';
export {
    ExportDefaultDeclarationTypeClass,
    exportDefaultDeclarationTypePair,
    isExportDefaultDeclarationType,
} from '../commons/exportDefaultDeclaration';
export {
    ExportNamedDeclarationTypeClass,
    exportNamedDeclarationTypePair,
    isExportNamedDeclarationType,
} from '../commons/exportNamedDeclaration';
export {
    ForOfStatementTypeClass,
    forOfStatementTypePair,
    isForOfStatementType,
} from '../commons/forOfStatement';
export {
    ImportDeclarationTypeClass,
    importDeclarationTypePair,
    isImportDeclarationType,
} from '../commons/importDeclaration';
export {
    DeclareClassTypeClass,
    declareClassTypePair,
    isDeclareClassType,
} from '../commons/declareClass';
export {
    DeclareFunctionTypeClass,
    declareFunctionTypePair,
    isDeclareFunctionType,
} from '../commons/declareFunction';
export {
    DeclareInterfaceTypeClass,
    declareInterfaceTypePair,
    isDeclareInterfaceType,
} from '../commons/declareInterface';
export {
    DeclareModuleTypeClass,
    declareModuleTypePair,
    isDeclareModuleType,
} from '../commons/declareModule';
export {
    DeclareModuleExportsTypeClass,
    declareModuleExportsTypePair,
    isDeclareModuleExportsType,
} from '../commons/declareModuleExports';
export {
    DeclareTypeAliasTypeClass,
    declareTypeAliasTypePair,
    isDeclareTypeAliasType,
} from '../commons/declareTypeAlias';
export {
    DeclareOpaqueTypeTypeClass,
    declareOpaqueTypeTypePair,
    isDeclareOpaqueTypeType,
} from '../commons/declareOpaqueType';
export {
    DeclareVariableTypeClass,
    declareVariableTypePair,
    isDeclareVariableType,
} from '../commons/declareVariable';
export {
    DeclareExportDeclarationTypeClass,
    declareExportDeclarationTypePair,
    isDeclareExportDeclarationType,
} from '../commons/declareExportDeclaration';
export {
    DeclareExportAllDeclarationTypeClass,
    declareExportAllDeclarationTypePair,
    isDeclareExportAllDeclarationType,
} from '../commons/declareExportAllDeclaration';
export {
    InterfaceDeclarationTypeClass,
    interfaceDeclarationTypePair,
    isInterfaceDeclarationType,
} from '../commons/interfaceDeclaration';
export { OpaqueTypeTypeClass, opaqueTypeTypePair, isOpaqueTypeType } from '../commons/opaqueType';
export { TypeAliasTypeClass, typeAliasTypePair, isTypeAliasType } from '../commons/typeAlias';
export {
    EnumDeclarationTypeClass,
    enumDeclarationTypePair,
    isEnumDeclarationType,
} from '../commons/enumDeclaration';
export {
    TSDeclareFunctionTypeClass,
    tSDeclareFunctionTypePair,
    isTSDeclareFunctionType,
} from '../commons/tSDeclareFunction';
export {
    TSInterfaceDeclarationTypeClass,
    tSInterfaceDeclarationTypePair,
    isTSInterfaceDeclarationType,
} from '../commons/tSInterfaceDeclaration';
export {
    TSTypeAliasDeclarationTypeClass,
    tSTypeAliasDeclarationTypePair,
    isTSTypeAliasDeclarationType,
} from '../commons/tSTypeAliasDeclaration';
export {
    TSEnumDeclarationTypeClass,
    tSEnumDeclarationTypePair,
    isTSEnumDeclarationType,
} from '../commons/tSEnumDeclaration';
export {
    TSModuleDeclarationTypeClass,
    tSModuleDeclarationTypePair,
    isTSModuleDeclarationType,
} from '../commons/tSModuleDeclaration';
export {
    TSImportEqualsDeclarationTypeClass,
    tSImportEqualsDeclarationTypePair,
    isTSImportEqualsDeclarationType,
} from '../commons/tSImportEqualsDeclaration';
export {
    TSExportAssignmentTypeClass,
    tSExportAssignmentTypePair,
    isTSExportAssignmentType,
} from '../commons/tSExportAssignment';
export {
    TSNamespaceExportDeclarationTypeClass,
    tSNamespaceExportDeclarationTypePair,
    isTSNamespaceExportDeclarationType,
} from '../commons/tSNamespaceExportDeclaration';

export const statementVisitorEvaluatePairs = lazyPairs(
    () =>
        [
            blockStatementTypePair,
            breakStatementTypePair,
            continueStatementTypePair,
            debuggerStatementTypePair,
            doWhileStatementTypePair,
            emptyStatementTypePair,
            expressionStatementTypePair,
            forInStatementTypePair,
            forStatementTypePair,
            functionDeclarationTypePair,
            ifStatementTypePair,
            labeledStatementTypePair,
            returnStatementTypePair,
            switchStatementTypePair,
            throwStatementTypePair,
            tryStatementTypePair,
            variableDeclarationTypePair,
            whileStatementTypePair,
            withStatementTypePair,
            classDeclarationTypePair,
            exportAllDeclarationTypePair,
            exportDefaultDeclarationTypePair,
            exportNamedDeclarationTypePair,
            forOfStatementTypePair,
            importDeclarationTypePair,
            declareClassTypePair,
            declareFunctionTypePair,
            declareInterfaceTypePair,
            declareModuleTypePair,
            declareModuleExportsTypePair,
            declareTypeAliasTypePair,
            declareOpaqueTypeTypePair,
            declareVariableTypePair,
            declareExportDeclarationTypePair,
            declareExportAllDeclarationTypePair,
            interfaceDeclarationTypePair,
            opaqueTypeTypePair,
            typeAliasTypePair,
            enumDeclarationTypePair,
            tSDeclareFunctionTypePair,
            tSInterfaceDeclarationTypePair,
            tSTypeAliasDeclarationTypePair,
            tSEnumDeclarationTypePair,
            tSModuleDeclarationTypePair,
            tSImportEqualsDeclarationTypePair,
            tSExportAssignmentTypePair,
            tSNamespaceExportDeclarationTypePair,
        ] as const,
);

export class StatementVisitor extends LwcCommonVisitor<
    ReturnType<typeof statementVisitorEvaluatePairs>[number]
> {
    get evaluatePair() {
        return statementVisitorEvaluatePairs();
    }
}

export type StatementTypeClass =
    | BlockStatementTypeClass
    | BreakStatementTypeClass
    | ContinueStatementTypeClass
    | DebuggerStatementTypeClass
    | DoWhileStatementTypeClass
    | EmptyStatementTypeClass
    | ExpressionStatementTypeClass
    | ForInStatementTypeClass
    | ForStatementTypeClass
    | FunctionDeclarationTypeClass
    | IfStatementTypeClass
    | LabeledStatementTypeClass
    | ReturnStatementTypeClass
    | SwitchStatementTypeClass
    | ThrowStatementTypeClass
    | TryStatementTypeClass
    | VariableDeclarationTypeClass
    | WhileStatementTypeClass
    | WithStatementTypeClass
    | ClassDeclarationTypeClass
    | ExportAllDeclarationTypeClass
    | ExportDefaultDeclarationTypeClass
    | ExportNamedDeclarationTypeClass
    | ForOfStatementTypeClass
    | ImportDeclarationTypeClass
    | DeclareClassTypeClass
    | DeclareFunctionTypeClass
    | DeclareInterfaceTypeClass
    | DeclareModuleTypeClass
    | DeclareModuleExportsTypeClass
    | DeclareTypeAliasTypeClass
    | DeclareOpaqueTypeTypeClass
    | DeclareVariableTypeClass
    | DeclareExportDeclarationTypeClass
    | DeclareExportAllDeclarationTypeClass
    | InterfaceDeclarationTypeClass
    | OpaqueTypeTypeClass
    | TypeAliasTypeClass
    | EnumDeclarationTypeClass
    | TSDeclareFunctionTypeClass
    | TSInterfaceDeclarationTypeClass
    | TSTypeAliasDeclarationTypeClass
    | TSEnumDeclarationTypeClass
    | TSModuleDeclarationTypeClass
    | TSImportEqualsDeclarationTypeClass
    | TSExportAssignmentTypeClass
    | TSNamespaceExportDeclarationTypeClass;

export const isStatementType = (
    target: LwcCommonTypeClass<string>,
): target is StatementTypeClass => {
    return (
        target instanceof BlockStatementTypeClass ||
        target instanceof BreakStatementTypeClass ||
        target instanceof ContinueStatementTypeClass ||
        target instanceof DebuggerStatementTypeClass ||
        target instanceof DoWhileStatementTypeClass ||
        target instanceof EmptyStatementTypeClass ||
        target instanceof ExpressionStatementTypeClass ||
        target instanceof ForInStatementTypeClass ||
        target instanceof ForStatementTypeClass ||
        target instanceof FunctionDeclarationTypeClass ||
        target instanceof IfStatementTypeClass ||
        target instanceof LabeledStatementTypeClass ||
        target instanceof ReturnStatementTypeClass ||
        target instanceof SwitchStatementTypeClass ||
        target instanceof ThrowStatementTypeClass ||
        target instanceof TryStatementTypeClass ||
        target instanceof VariableDeclarationTypeClass ||
        target instanceof WhileStatementTypeClass ||
        target instanceof WithStatementTypeClass ||
        target instanceof ClassDeclarationTypeClass ||
        target instanceof ExportAllDeclarationTypeClass ||
        target instanceof ExportDefaultDeclarationTypeClass ||
        target instanceof ExportNamedDeclarationTypeClass ||
        target instanceof ForOfStatementTypeClass ||
        target instanceof ImportDeclarationTypeClass ||
        target instanceof DeclareClassTypeClass ||
        target instanceof DeclareFunctionTypeClass ||
        target instanceof DeclareInterfaceTypeClass ||
        target instanceof DeclareModuleTypeClass ||
        target instanceof DeclareModuleExportsTypeClass ||
        target instanceof DeclareTypeAliasTypeClass ||
        target instanceof DeclareOpaqueTypeTypeClass ||
        target instanceof DeclareVariableTypeClass ||
        target instanceof DeclareExportDeclarationTypeClass ||
        target instanceof DeclareExportAllDeclarationTypeClass ||
        target instanceof InterfaceDeclarationTypeClass ||
        target instanceof OpaqueTypeTypeClass ||
        target instanceof TypeAliasTypeClass ||
        target instanceof EnumDeclarationTypeClass ||
        target instanceof TSDeclareFunctionTypeClass ||
        target instanceof TSInterfaceDeclarationTypeClass ||
        target instanceof TSTypeAliasDeclarationTypeClass ||
        target instanceof TSEnumDeclarationTypeClass ||
        target instanceof TSModuleDeclarationTypeClass ||
        target instanceof TSImportEqualsDeclarationTypeClass ||
        target instanceof TSExportAssignmentTypeClass ||
        target instanceof TSNamespaceExportDeclarationTypeClass
    );
};
