import { LwcCommonTypeClass, LwcCommonVisitor } from '../commonVisitor';
import { ArrayExpressionTypeClass, arrayExpressionTypePair } from '../commons/arrayExpression';
import {
    AssignmentExpressionTypeClass,
    assignmentExpressionTypePair,
} from '../commons/assignmentExpression';
import { BinaryExpressionTypeClass, binaryExpressionTypePair } from '../commons/binaryExpression';
import {
    InterpreterDirectiveTypeClass,
    interpreterDirectiveTypePair,
} from './interpreterDirective';
import { DirectiveTypeClass, directiveTypePair } from './directive';
import { DirectiveLiteralTypeClass, directiveLiteralTypePair } from './directiveLiteral';
import { BlockStatementTypeClass, blockStatementTypePair } from '../commons/blockStatement';
import { BreakStatementTypeClass, breakStatementTypePair } from '../commons/breakStatement';
import { CallExpressionTypeClass, callExpressionTypePair } from '../commons/callExpression';
import { CatchClauseTypeClass, catchClauseTypePair } from '../commons/catchClause';
import {
    ConditionalExpressionTypeClass,
    conditionalExpressionTypePair,
} from '../commons/conditionalExpression';
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
import { FileTypeClass, fileTypePair } from './file';
import { ForInStatementTypeClass, forInStatementTypePair } from '../commons/forInStatement';
import { ForStatementTypeClass, forStatementTypePair } from '../commons/forStatement';
import {
    FunctionDeclarationTypeClass,
    functionDeclarationTypePair,
} from '../commons/functionDeclaration';
import {
    FunctionExpressionTypeClass,
    functionExpressionTypePair,
} from '../commons/functionExpression';
import { IdentifierTypeClass, identifierTypePair } from '../commons/identifier';
import { IfStatementTypeClass, ifStatementTypePair } from '../commons/ifStatement';
import { LabeledStatementTypeClass, labeledStatementTypePair } from '../commons/labeledStatement';
import { StringLiteralTypeClass, stringLiteralTypePair } from '../commons/stringLiteral';
import { NumericLiteralTypeClass, numericLiteralTypePair } from '../commons/numericLiteral';
import { NullLiteralTypeClass, nullLiteralTypePair } from '../commons/nullLiteral';
import { BooleanLiteralTypeClass, booleanLiteralTypePair } from '../commons/booleanLiteral';
import { RegExpLiteralTypeClass, regExpLiteralTypePair } from '../commons/regExpLiteral';
import {
    LogicalExpressionTypeClass,
    logicalExpressionTypePair,
} from '../commons/logicalExpression';
import { MemberExpressionTypeClass, memberExpressionTypePair } from '../commons/memberExpression';
import { NewExpressionTypeClass, newExpressionTypePair } from '../commons/newExpression';
import { ProgramTypeClass, programTypePair } from '../commons/program';
import { ObjectExpressionTypeClass, objectExpressionTypePair } from '../commons/objectExpression';
import { ObjectMethodTypeClass, objectMethodTypePair } from '../commons/objectMethod';
import { ObjectPropertyTypeClass, objectPropertyTypePair } from '../commons/objectProperty';
import { RestElementTypeClass, restElementTypePair } from '../commons/restElement';
import { ReturnStatementTypeClass, returnStatementTypePair } from '../commons/returnStatement';
import {
    SequenceExpressionTypeClass,
    sequenceExpressionTypePair,
} from '../commons/sequenceExpression';
import {
    ParenthesizedExpressionTypeClass,
    parenthesizedExpressionTypePair,
} from '../commons/parenthesizedExpression';
import { SwitchCaseTypeClass, switchCaseTypePair } from './switchCase';
import { SwitchStatementTypeClass, switchStatementTypePair } from '../commons/switchStatement';
import { ThisExpressionTypeClass, thisExpressionTypePair } from '../commons/thisExpression';
import { ThrowStatementTypeClass, throwStatementTypePair } from '../commons/throwStatement';
import { TryStatementTypeClass, tryStatementTypePair } from '../commons/tryStatement';
import { UnaryExpressionTypeClass, unaryExpressionTypePair } from '../commons/unaryExpression';
import { UpdateExpressionTypeClass, updateExpressionTypePair } from '../commons/updateExpression';
import {
    VariableDeclarationTypeClass,
    variableDeclarationTypePair,
} from '../commons/variableDeclaration';
import { VariableDeclaratorTypeClass, variableDeclaratorTypePair } from './variableDeclarator';
import { WhileStatementTypeClass, whileStatementTypePair } from '../commons/whileStatement';
import { WithStatementTypeClass, withStatementTypePair } from '../commons/withStatement';
import {
    AssignmentPatternTypeClass,
    assignmentPatternTypePair,
} from '../commons/assignmentPattern';
import { ArrayPatternTypeClass, arrayPatternTypePair } from '../commons/arrayPattern';
import {
    ArrowFunctionExpressionTypeClass,
    arrowFunctionExpressionTypePair,
} from '../commons/arrowFunctionExpression';
import { ClassBodyTypeClass, classBodyTypePair } from './classBody';
import { ClassExpressionTypeClass, classExpressionTypePair } from '../commons/classExpression';
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
import { ExportSpecifierTypeClass, exportSpecifierTypePair } from '../commons/exportSpecifier';
import { ForOfStatementTypeClass, forOfStatementTypePair } from '../commons/forOfStatement';
import {
    ImportDeclarationTypeClass,
    importDeclarationTypePair,
} from '../commons/importDeclaration';
import {
    ImportDefaultSpecifierTypeClass,
    importDefaultSpecifierTypePair,
} from '../commons/importDefaultSpecifier';
import {
    ImportNamespaceSpecifierTypeClass,
    importNamespaceSpecifierTypePair,
} from '../commons/importNamespaceSpecifier';
import { ImportSpecifierTypeClass, importSpecifierTypePair } from '../commons/importSpecifier';
import { MetaPropertyTypeClass, metaPropertyTypePair } from '../commons/metaProperty';
import { ClassMethodTypeClass, classMethodTypePair } from '../commons/classMethod';
import { ObjectPatternTypeClass, objectPatternTypePair } from '../commons/objectPattern';
import { SpreadElementTypeClass, spreadElementTypePair } from '../commons/spreadElement';
import { SuperTypeClass, superTypePair } from './super';
import {
    TaggedTemplateExpressionTypeClass,
    taggedTemplateExpressionTypePair,
} from '../commons/taggedTemplateExpression';
import { TemplateElementTypeClass, templateElementTypePair } from './templateElement';
import { TemplateLiteralTypeClass, templateLiteralTypePair } from '../commons/templateLiteral';
import { YieldExpressionTypeClass, yieldExpressionTypePair } from '../commons/yieldExpression';
import { AwaitExpressionTypeClass, awaitExpressionTypePair } from '../commons/awaitExpression';
import { ImportExpressionTypeClass, importExpressionTypePair } from '../commons/importExpression';
import { ImportTypeClass, importTypePair } from './import';
import { BigIntLiteralTypeClass, bigIntLiteralTypePair } from '../commons/bigIntLiteral';
import {
    ExportNamespaceSpecifierTypeClass,
    exportNamespaceSpecifierTypePair,
} from '../commons/exportNamespaceSpecifier';
import {
    OptionalMemberExpressionTypeClass,
    optionalMemberExpressionTypePair,
} from '../commons/optionalMemberExpression';
import {
    OptionalCallExpressionTypeClass,
    optionalCallExpressionTypePair,
} from '../commons/optionalCallExpression';
import { ClassPropertyTypeClass, classPropertyTypePair } from '../commons/classProperty';
import {
    ClassPrivatePropertyTypeClass,
    classPrivatePropertyTypePair,
} from '../commons/classPrivateProperty';
import {
    ClassPrivateMethodTypeClass,
    classPrivateMethodTypePair,
} from '../commons/classPrivateMethod';
import { PrivateNameTypeClass, privateNameTypePair } from '../commons/privateName';
import { StaticBlockTypeClass, staticBlockTypePair } from '../commons/staticBlock';
import { ImportAttributeTypeClass, importAttributeTypePair } from './importAttribute';

export {
    ArrayExpressionTypeClass,
    arrayExpressionTypePair,
    isArrayExpressionType,
} from '../commons/arrayExpression';
export {
    AssignmentExpressionTypeClass,
    assignmentExpressionTypePair,
    isAssignmentExpressionType,
} from '../commons/assignmentExpression';
export {
    BinaryExpressionTypeClass,
    binaryExpressionTypePair,
    isBinaryExpressionType,
} from '../commons/binaryExpression';
export {
    InterpreterDirectiveTypeClass,
    interpreterDirectiveTypePair,
    isInterpreterDirectiveType,
} from './interpreterDirective';
export { DirectiveTypeClass, directiveTypePair, isDirectiveType } from './directive';
export {
    DirectiveLiteralTypeClass,
    directiveLiteralTypePair,
    isDirectiveLiteralType,
} from './directiveLiteral';
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
    CallExpressionTypeClass,
    callExpressionTypePair,
    isCallExpressionType,
} from '../commons/callExpression';
export {
    CatchClauseTypeClass,
    catchClauseTypePair,
    isCatchClauseType,
} from '../commons/catchClause';
export {
    ConditionalExpressionTypeClass,
    conditionalExpressionTypePair,
    isConditionalExpressionType,
} from '../commons/conditionalExpression';
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
export { FileTypeClass, fileTypePair, isFileType } from './file';
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
    FunctionExpressionTypeClass,
    functionExpressionTypePair,
    isFunctionExpressionType,
} from '../commons/functionExpression';
export { IdentifierTypeClass, identifierTypePair, isIdentifierType } from '../commons/identifier';
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
    StringLiteralTypeClass,
    stringLiteralTypePair,
    isStringLiteralType,
} from '../commons/stringLiteral';
export {
    NumericLiteralTypeClass,
    numericLiteralTypePair,
    isNumericLiteralType,
} from '../commons/numericLiteral';
export {
    NullLiteralTypeClass,
    nullLiteralTypePair,
    isNullLiteralType,
} from '../commons/nullLiteral';
export {
    BooleanLiteralTypeClass,
    booleanLiteralTypePair,
    isBooleanLiteralType,
} from '../commons/booleanLiteral';
export {
    RegExpLiteralTypeClass,
    regExpLiteralTypePair,
    isRegExpLiteralType,
} from '../commons/regExpLiteral';
export {
    LogicalExpressionTypeClass,
    logicalExpressionTypePair,
    isLogicalExpressionType,
} from '../commons/logicalExpression';
export {
    MemberExpressionTypeClass,
    memberExpressionTypePair,
    isMemberExpressionType,
} from '../commons/memberExpression';
export {
    NewExpressionTypeClass,
    newExpressionTypePair,
    isNewExpressionType,
} from '../commons/newExpression';
export { ProgramTypeClass, programTypePair, isProgramType } from '../commons/program';
export {
    ObjectExpressionTypeClass,
    objectExpressionTypePair,
    isObjectExpressionType,
} from '../commons/objectExpression';
export {
    ObjectMethodTypeClass,
    objectMethodTypePair,
    isObjectMethodType,
} from '../commons/objectMethod';
export {
    ObjectPropertyTypeClass,
    objectPropertyTypePair,
    isObjectPropertyType,
} from '../commons/objectProperty';
export {
    RestElementTypeClass,
    restElementTypePair,
    isRestElementType,
} from '../commons/restElement';
export {
    ReturnStatementTypeClass,
    returnStatementTypePair,
    isReturnStatementType,
} from '../commons/returnStatement';
export {
    SequenceExpressionTypeClass,
    sequenceExpressionTypePair,
    isSequenceExpressionType,
} from '../commons/sequenceExpression';
export {
    ParenthesizedExpressionTypeClass,
    parenthesizedExpressionTypePair,
    isParenthesizedExpressionType,
} from '../commons/parenthesizedExpression';
export { SwitchCaseTypeClass, switchCaseTypePair, isSwitchCaseType } from './switchCase';
export {
    SwitchStatementTypeClass,
    switchStatementTypePair,
    isSwitchStatementType,
} from '../commons/switchStatement';
export {
    ThisExpressionTypeClass,
    thisExpressionTypePair,
    isThisExpressionType,
} from '../commons/thisExpression';
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
    UnaryExpressionTypeClass,
    unaryExpressionTypePair,
    isUnaryExpressionType,
} from '../commons/unaryExpression';
export {
    UpdateExpressionTypeClass,
    updateExpressionTypePair,
    isUpdateExpressionType,
} from '../commons/updateExpression';
export {
    VariableDeclarationTypeClass,
    variableDeclarationTypePair,
    isVariableDeclarationType,
} from '../commons/variableDeclaration';
export {
    VariableDeclaratorTypeClass,
    variableDeclaratorTypePair,
    isVariableDeclaratorType,
} from './variableDeclarator';
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
    AssignmentPatternTypeClass,
    assignmentPatternTypePair,
    isAssignmentPatternType,
} from '../commons/assignmentPattern';
export {
    ArrayPatternTypeClass,
    arrayPatternTypePair,
    isArrayPatternType,
} from '../commons/arrayPattern';
export {
    ArrowFunctionExpressionTypeClass,
    arrowFunctionExpressionTypePair,
    isArrowFunctionExpressionType,
} from '../commons/arrowFunctionExpression';
export { ClassBodyTypeClass, classBodyTypePair, isClassBodyType } from './classBody';
export {
    ClassExpressionTypeClass,
    classExpressionTypePair,
    isClassExpressionType,
} from '../commons/classExpression';
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
    ExportSpecifierTypeClass,
    exportSpecifierTypePair,
    isExportSpecifierType,
} from '../commons/exportSpecifier';
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
    ImportDefaultSpecifierTypeClass,
    importDefaultSpecifierTypePair,
    isImportDefaultSpecifierType,
} from '../commons/importDefaultSpecifier';
export {
    ImportNamespaceSpecifierTypeClass,
    importNamespaceSpecifierTypePair,
    isImportNamespaceSpecifierType,
} from '../commons/importNamespaceSpecifier';
export {
    ImportSpecifierTypeClass,
    importSpecifierTypePair,
    isImportSpecifierType,
} from '../commons/importSpecifier';
export {
    MetaPropertyTypeClass,
    metaPropertyTypePair,
    isMetaPropertyType,
} from '../commons/metaProperty';
export {
    ClassMethodTypeClass,
    classMethodTypePair,
    isClassMethodType,
} from '../commons/classMethod';
export {
    ObjectPatternTypeClass,
    objectPatternTypePair,
    isObjectPatternType,
} from '../commons/objectPattern';
export {
    SpreadElementTypeClass,
    spreadElementTypePair,
    isSpreadElementType,
} from '../commons/spreadElement';
export { SuperTypeClass, superTypePair, isSuperType } from './super';
export {
    TaggedTemplateExpressionTypeClass,
    taggedTemplateExpressionTypePair,
    isTaggedTemplateExpressionType,
} from '../commons/taggedTemplateExpression';
export {
    TemplateElementTypeClass,
    templateElementTypePair,
    isTemplateElementType,
} from './templateElement';
export {
    TemplateLiteralTypeClass,
    templateLiteralTypePair,
    isTemplateLiteralType,
} from '../commons/templateLiteral';
export {
    YieldExpressionTypeClass,
    yieldExpressionTypePair,
    isYieldExpressionType,
} from '../commons/yieldExpression';
export {
    AwaitExpressionTypeClass,
    awaitExpressionTypePair,
    isAwaitExpressionType,
} from '../commons/awaitExpression';
export {
    ImportExpressionTypeClass,
    importExpressionTypePair,
    isImportExpressionType,
} from '../commons/importExpression';
export { ImportTypeClass, importTypePair, isImportType } from './import';
export {
    BigIntLiteralTypeClass,
    bigIntLiteralTypePair,
    isBigIntLiteralType,
} from '../commons/bigIntLiteral';
export {
    ExportNamespaceSpecifierTypeClass,
    exportNamespaceSpecifierTypePair,
    isExportNamespaceSpecifierType,
} from '../commons/exportNamespaceSpecifier';
export {
    OptionalMemberExpressionTypeClass,
    optionalMemberExpressionTypePair,
    isOptionalMemberExpressionType,
} from '../commons/optionalMemberExpression';
export {
    OptionalCallExpressionTypeClass,
    optionalCallExpressionTypePair,
    isOptionalCallExpressionType,
} from '../commons/optionalCallExpression';
export {
    ClassPropertyTypeClass,
    classPropertyTypePair,
    isClassPropertyType,
} from '../commons/classProperty';
export {
    ClassPrivatePropertyTypeClass,
    classPrivatePropertyTypePair,
    isClassPrivatePropertyType,
} from '../commons/classPrivateProperty';
export {
    ClassPrivateMethodTypeClass,
    classPrivateMethodTypePair,
    isClassPrivateMethodType,
} from '../commons/classPrivateMethod';
export {
    PrivateNameTypeClass,
    privateNameTypePair,
    isPrivateNameType,
} from '../commons/privateName';
export {
    StaticBlockTypeClass,
    staticBlockTypePair,
    isStaticBlockType,
} from '../commons/staticBlock';
export {
    ImportAttributeTypeClass,
    importAttributeTypePair,
    isImportAttributeType,
} from './importAttribute';

const standardizedVisitorEvaluatePairs = [
    arrayExpressionTypePair,
    assignmentExpressionTypePair,
    binaryExpressionTypePair,
    interpreterDirectiveTypePair,
    directiveTypePair,
    directiveLiteralTypePair,
    blockStatementTypePair,
    breakStatementTypePair,
    callExpressionTypePair,
    catchClauseTypePair,
    conditionalExpressionTypePair,
    continueStatementTypePair,
    debuggerStatementTypePair,
    doWhileStatementTypePair,
    emptyStatementTypePair,
    expressionStatementTypePair,
    fileTypePair,
    forInStatementTypePair,
    forStatementTypePair,
    functionDeclarationTypePair,
    functionExpressionTypePair,
    identifierTypePair,
    ifStatementTypePair,
    labeledStatementTypePair,
    stringLiteralTypePair,
    numericLiteralTypePair,
    nullLiteralTypePair,
    booleanLiteralTypePair,
    regExpLiteralTypePair,
    logicalExpressionTypePair,
    memberExpressionTypePair,
    newExpressionTypePair,
    programTypePair,
    objectExpressionTypePair,
    objectMethodTypePair,
    objectPropertyTypePair,
    restElementTypePair,
    returnStatementTypePair,
    sequenceExpressionTypePair,
    parenthesizedExpressionTypePair,
    switchCaseTypePair,
    switchStatementTypePair,
    thisExpressionTypePair,
    throwStatementTypePair,
    tryStatementTypePair,
    unaryExpressionTypePair,
    updateExpressionTypePair,
    variableDeclarationTypePair,
    variableDeclaratorTypePair,
    whileStatementTypePair,
    withStatementTypePair,
    assignmentPatternTypePair,
    arrayPatternTypePair,
    arrowFunctionExpressionTypePair,
    classBodyTypePair,
    classExpressionTypePair,
    classDeclarationTypePair,
    exportAllDeclarationTypePair,
    exportDefaultDeclarationTypePair,
    exportNamedDeclarationTypePair,
    exportSpecifierTypePair,
    forOfStatementTypePair,
    importDeclarationTypePair,
    importDefaultSpecifierTypePair,
    importNamespaceSpecifierTypePair,
    importSpecifierTypePair,
    metaPropertyTypePair,
    classMethodTypePair,
    objectPatternTypePair,
    spreadElementTypePair,
    superTypePair,
    taggedTemplateExpressionTypePair,
    templateElementTypePair,
    templateLiteralTypePair,
    yieldExpressionTypePair,
    awaitExpressionTypePair,
    importExpressionTypePair,
    importTypePair,
    bigIntLiteralTypePair,
    exportNamespaceSpecifierTypePair,
    optionalMemberExpressionTypePair,
    optionalCallExpressionTypePair,
    classPropertyTypePair,
    classPrivatePropertyTypePair,
    classPrivateMethodTypePair,
    privateNameTypePair,
    staticBlockTypePair,
    importAttributeTypePair,
] as const;

export class StandardizedVisitor extends LwcCommonVisitor<
    (typeof standardizedVisitorEvaluatePairs)[number]
> {
    readonly evaluatePair = standardizedVisitorEvaluatePairs;
}

export type StandardizedTypeClass =
    | ArrayExpressionTypeClass
    | AssignmentExpressionTypeClass
    | BinaryExpressionTypeClass
    | InterpreterDirectiveTypeClass
    | DirectiveTypeClass
    | DirectiveLiteralTypeClass
    | BlockStatementTypeClass
    | BreakStatementTypeClass
    | CallExpressionTypeClass
    | CatchClauseTypeClass
    | ConditionalExpressionTypeClass
    | ContinueStatementTypeClass
    | DebuggerStatementTypeClass
    | DoWhileStatementTypeClass
    | EmptyStatementTypeClass
    | ExpressionStatementTypeClass
    | FileTypeClass
    | ForInStatementTypeClass
    | ForStatementTypeClass
    | FunctionDeclarationTypeClass
    | FunctionExpressionTypeClass
    | IdentifierTypeClass
    | IfStatementTypeClass
    | LabeledStatementTypeClass
    | StringLiteralTypeClass
    | NumericLiteralTypeClass
    | NullLiteralTypeClass
    | BooleanLiteralTypeClass
    | RegExpLiteralTypeClass
    | LogicalExpressionTypeClass
    | MemberExpressionTypeClass
    | NewExpressionTypeClass
    | ProgramTypeClass
    | ObjectExpressionTypeClass
    | ObjectMethodTypeClass
    | ObjectPropertyTypeClass
    | RestElementTypeClass
    | ReturnStatementTypeClass
    | SequenceExpressionTypeClass
    | ParenthesizedExpressionTypeClass
    | SwitchCaseTypeClass
    | SwitchStatementTypeClass
    | ThisExpressionTypeClass
    | ThrowStatementTypeClass
    | TryStatementTypeClass
    | UnaryExpressionTypeClass
    | UpdateExpressionTypeClass
    | VariableDeclarationTypeClass
    | VariableDeclaratorTypeClass
    | WhileStatementTypeClass
    | WithStatementTypeClass
    | AssignmentPatternTypeClass
    | ArrayPatternTypeClass
    | ArrowFunctionExpressionTypeClass
    | ClassBodyTypeClass
    | ClassExpressionTypeClass
    | ClassDeclarationTypeClass
    | ExportAllDeclarationTypeClass
    | ExportDefaultDeclarationTypeClass
    | ExportNamedDeclarationTypeClass
    | ExportSpecifierTypeClass
    | ForOfStatementTypeClass
    | ImportDeclarationTypeClass
    | ImportDefaultSpecifierTypeClass
    | ImportNamespaceSpecifierTypeClass
    | ImportSpecifierTypeClass
    | MetaPropertyTypeClass
    | ClassMethodTypeClass
    | ObjectPatternTypeClass
    | SpreadElementTypeClass
    | SuperTypeClass
    | TaggedTemplateExpressionTypeClass
    | TemplateElementTypeClass
    | TemplateLiteralTypeClass
    | YieldExpressionTypeClass
    | AwaitExpressionTypeClass
    | ImportExpressionTypeClass
    | ImportTypeClass
    | BigIntLiteralTypeClass
    | ExportNamespaceSpecifierTypeClass
    | OptionalMemberExpressionTypeClass
    | OptionalCallExpressionTypeClass
    | ClassPropertyTypeClass
    | ClassPrivatePropertyTypeClass
    | ClassPrivateMethodTypeClass
    | PrivateNameTypeClass
    | StaticBlockTypeClass
    | ImportAttributeTypeClass;

export const isStandardizedType = (
    target: LwcCommonTypeClass<string>,
): target is StandardizedTypeClass => {
    return (
        target instanceof ArrayExpressionTypeClass ||
        target instanceof AssignmentExpressionTypeClass ||
        target instanceof BinaryExpressionTypeClass ||
        target instanceof InterpreterDirectiveTypeClass ||
        target instanceof DirectiveTypeClass ||
        target instanceof DirectiveLiteralTypeClass ||
        target instanceof BlockStatementTypeClass ||
        target instanceof BreakStatementTypeClass ||
        target instanceof CallExpressionTypeClass ||
        target instanceof CatchClauseTypeClass ||
        target instanceof ConditionalExpressionTypeClass ||
        target instanceof ContinueStatementTypeClass ||
        target instanceof DebuggerStatementTypeClass ||
        target instanceof DoWhileStatementTypeClass ||
        target instanceof EmptyStatementTypeClass ||
        target instanceof ExpressionStatementTypeClass ||
        target instanceof FileTypeClass ||
        target instanceof ForInStatementTypeClass ||
        target instanceof ForStatementTypeClass ||
        target instanceof FunctionDeclarationTypeClass ||
        target instanceof FunctionExpressionTypeClass ||
        target instanceof IdentifierTypeClass ||
        target instanceof IfStatementTypeClass ||
        target instanceof LabeledStatementTypeClass ||
        target instanceof StringLiteralTypeClass ||
        target instanceof NumericLiteralTypeClass ||
        target instanceof NullLiteralTypeClass ||
        target instanceof BooleanLiteralTypeClass ||
        target instanceof RegExpLiteralTypeClass ||
        target instanceof LogicalExpressionTypeClass ||
        target instanceof MemberExpressionTypeClass ||
        target instanceof NewExpressionTypeClass ||
        target instanceof ProgramTypeClass ||
        target instanceof ObjectExpressionTypeClass ||
        target instanceof ObjectMethodTypeClass ||
        target instanceof ObjectPropertyTypeClass ||
        target instanceof RestElementTypeClass ||
        target instanceof ReturnStatementTypeClass ||
        target instanceof SequenceExpressionTypeClass ||
        target instanceof ParenthesizedExpressionTypeClass ||
        target instanceof SwitchCaseTypeClass ||
        target instanceof SwitchStatementTypeClass ||
        target instanceof ThisExpressionTypeClass ||
        target instanceof ThrowStatementTypeClass ||
        target instanceof TryStatementTypeClass ||
        target instanceof UnaryExpressionTypeClass ||
        target instanceof UpdateExpressionTypeClass ||
        target instanceof VariableDeclarationTypeClass ||
        target instanceof VariableDeclaratorTypeClass ||
        target instanceof WhileStatementTypeClass ||
        target instanceof WithStatementTypeClass ||
        target instanceof AssignmentPatternTypeClass ||
        target instanceof ArrayPatternTypeClass ||
        target instanceof ArrowFunctionExpressionTypeClass ||
        target instanceof ClassBodyTypeClass ||
        target instanceof ClassExpressionTypeClass ||
        target instanceof ClassDeclarationTypeClass ||
        target instanceof ExportAllDeclarationTypeClass ||
        target instanceof ExportDefaultDeclarationTypeClass ||
        target instanceof ExportNamedDeclarationTypeClass ||
        target instanceof ExportSpecifierTypeClass ||
        target instanceof ForOfStatementTypeClass ||
        target instanceof ImportDeclarationTypeClass ||
        target instanceof ImportDefaultSpecifierTypeClass ||
        target instanceof ImportNamespaceSpecifierTypeClass ||
        target instanceof ImportSpecifierTypeClass ||
        target instanceof MetaPropertyTypeClass ||
        target instanceof ClassMethodTypeClass ||
        target instanceof ObjectPatternTypeClass ||
        target instanceof SpreadElementTypeClass ||
        target instanceof SuperTypeClass ||
        target instanceof TaggedTemplateExpressionTypeClass ||
        target instanceof TemplateElementTypeClass ||
        target instanceof TemplateLiteralTypeClass ||
        target instanceof YieldExpressionTypeClass ||
        target instanceof AwaitExpressionTypeClass ||
        target instanceof ImportExpressionTypeClass ||
        target instanceof ImportTypeClass ||
        target instanceof BigIntLiteralTypeClass ||
        target instanceof ExportNamespaceSpecifierTypeClass ||
        target instanceof OptionalMemberExpressionTypeClass ||
        target instanceof OptionalCallExpressionTypeClass ||
        target instanceof ClassPropertyTypeClass ||
        target instanceof ClassPrivatePropertyTypeClass ||
        target instanceof ClassPrivateMethodTypeClass ||
        target instanceof PrivateNameTypeClass ||
        target instanceof StaticBlockTypeClass ||
        target instanceof ImportAttributeTypeClass
    );
};
