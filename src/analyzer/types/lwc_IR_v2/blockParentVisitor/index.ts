import { LwcCommonTypeClass, LwcCommonVisitor, lazyPairs } from '../commonVisitor';
import { BlockStatementTypeClass, blockStatementTypePair } from '../commons/blockStatement';
import { CatchClauseTypeClass, catchClauseTypePair } from '../commons/catchClause';
import { DoWhileStatementTypeClass, doWhileStatementTypePair } from '../commons/doWhileStatement';
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
import { ProgramTypeClass, programTypePair } from '../commons/program';
import { ObjectMethodTypeClass, objectMethodTypePair } from '../commons/objectMethod';
import { SwitchStatementTypeClass, switchStatementTypePair } from '../commons/switchStatement';
import { WhileStatementTypeClass, whileStatementTypePair } from '../commons/whileStatement';
import {
    ArrowFunctionExpressionTypeClass,
    arrowFunctionExpressionTypePair,
} from '../commons/arrowFunctionExpression';
import { ForOfStatementTypeClass, forOfStatementTypePair } from '../commons/forOfStatement';
import { ClassMethodTypeClass, classMethodTypePair } from '../commons/classMethod';
import {
    ClassPrivateMethodTypeClass,
    classPrivateMethodTypePair,
} from '../commons/classPrivateMethod';
import { StaticBlockTypeClass, staticBlockTypePair } from '../commons/staticBlock';
import { TSModuleBlockTypeClass, tSModuleBlockTypePair } from '../commons/tSModuleBlock';

export {
    BlockStatementTypeClass,
    blockStatementTypePair,
    isBlockStatementType,
} from '../commons/blockStatement';
export {
    CatchClauseTypeClass,
    catchClauseTypePair,
    isCatchClauseType,
} from '../commons/catchClause';
export {
    DoWhileStatementTypeClass,
    doWhileStatementTypePair,
    isDoWhileStatementType,
} from '../commons/doWhileStatement';
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
export { ProgramTypeClass, programTypePair, isProgramType } from '../commons/program';
export {
    ObjectMethodTypeClass,
    objectMethodTypePair,
    isObjectMethodType,
} from '../commons/objectMethod';
export {
    SwitchStatementTypeClass,
    switchStatementTypePair,
    isSwitchStatementType,
} from '../commons/switchStatement';
export {
    WhileStatementTypeClass,
    whileStatementTypePair,
    isWhileStatementType,
} from '../commons/whileStatement';
export {
    ArrowFunctionExpressionTypeClass,
    arrowFunctionExpressionTypePair,
    isArrowFunctionExpressionType,
} from '../commons/arrowFunctionExpression';
export {
    ForOfStatementTypeClass,
    forOfStatementTypePair,
    isForOfStatementType,
} from '../commons/forOfStatement';
export {
    ClassMethodTypeClass,
    classMethodTypePair,
    isClassMethodType,
} from '../commons/classMethod';
export {
    ClassPrivateMethodTypeClass,
    classPrivateMethodTypePair,
    isClassPrivateMethodType,
} from '../commons/classPrivateMethod';
export {
    StaticBlockTypeClass,
    staticBlockTypePair,
    isStaticBlockType,
} from '../commons/staticBlock';
export {
    TSModuleBlockTypeClass,
    tSModuleBlockTypePair,
    isTSModuleBlockType,
} from '../commons/tSModuleBlock';

export const blockParentVisitorEvaluatePairs = lazyPairs(
    () =>
        [
            blockStatementTypePair,
            catchClauseTypePair,
            doWhileStatementTypePair,
            forInStatementTypePair,
            forStatementTypePair,
            functionDeclarationTypePair,
            functionExpressionTypePair,
            programTypePair,
            objectMethodTypePair,
            switchStatementTypePair,
            whileStatementTypePair,
            arrowFunctionExpressionTypePair,
            forOfStatementTypePair,
            classMethodTypePair,
            classPrivateMethodTypePair,
            staticBlockTypePair,
            tSModuleBlockTypePair,
        ] as const,
);

export class BlockParentVisitor extends LwcCommonVisitor<
    ReturnType<typeof blockParentVisitorEvaluatePairs>[number]
> {
    get evaluatePair() {
        return blockParentVisitorEvaluatePairs();
    }
}

export type BlockParentTypeClass =
    | BlockStatementTypeClass
    | CatchClauseTypeClass
    | DoWhileStatementTypeClass
    | ForInStatementTypeClass
    | ForStatementTypeClass
    | FunctionDeclarationTypeClass
    | FunctionExpressionTypeClass
    | ProgramTypeClass
    | ObjectMethodTypeClass
    | SwitchStatementTypeClass
    | WhileStatementTypeClass
    | ArrowFunctionExpressionTypeClass
    | ForOfStatementTypeClass
    | ClassMethodTypeClass
    | ClassPrivateMethodTypeClass
    | StaticBlockTypeClass
    | TSModuleBlockTypeClass;

export const isBlockParentType = (
    target: LwcCommonTypeClass<string>,
): target is BlockParentTypeClass => {
    return (
        target instanceof BlockStatementTypeClass ||
        target instanceof CatchClauseTypeClass ||
        target instanceof DoWhileStatementTypeClass ||
        target instanceof ForInStatementTypeClass ||
        target instanceof ForStatementTypeClass ||
        target instanceof FunctionDeclarationTypeClass ||
        target instanceof FunctionExpressionTypeClass ||
        target instanceof ProgramTypeClass ||
        target instanceof ObjectMethodTypeClass ||
        target instanceof SwitchStatementTypeClass ||
        target instanceof WhileStatementTypeClass ||
        target instanceof ArrowFunctionExpressionTypeClass ||
        target instanceof ForOfStatementTypeClass ||
        target instanceof ClassMethodTypeClass ||
        target instanceof ClassPrivateMethodTypeClass ||
        target instanceof StaticBlockTypeClass ||
        target instanceof TSModuleBlockTypeClass
    );
};
