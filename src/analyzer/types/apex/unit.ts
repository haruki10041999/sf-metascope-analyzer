import typia from 'typia';
import {
    ConvertType,
    ErrorJson,
    JsonType,
    convertValue,
    isErrorNode,
    makeErrorJson,
    makeJsonType,
} from './commons';

import {
    AnonymousBlockMemberType,
    AnonymousUnitType,
    CompilationUnitType,
    IdType,
    TriggerBlockMemberType,
    TriggerCaseType,
    TriggerUnitType,
} from './converter';
import { StatementJson, makeStatementJson } from './statement';
import {
    MemberDeclarationJson,
    makeMemberDeclarationJson,
    InterfaceDeclarationJson,
    makeInterfaceDeclarationJson,
    ClassDeclarationJson,
    makeClassDeclarationJson,
    EnumDeclarationJson,
    makeEnumDeclarationJson,
} from './declaration';

import { ModifiersJson, makeModifiersJson } from './modifier';

// unit は境界ノードにしない（unit ごとに JSON ファイルを保存する）。
// 直下のエラーノードは、その位置に ErrorJson として残す
const ERROR_KIND = 'unit';

type BlockMemberJson =
    | (MemberDeclarationJson & { modifier: ModifiersJson })
    | { type: 'statement'; statement: StatementJson | ErrorJson; modifier: ModifiersJson }
    | ErrorJson;

const makeBlockMemberJson = (
    target: ConvertType<AnonymousBlockMemberType | TriggerBlockMemberType>,
): BlockMemberJson => {
    if (isErrorNode(target)) {
        return makeErrorJson(target, ERROR_KIND);
    }

    const member = target.value;
    if (isErrorNode(member)) {
        return makeErrorJson(member, ERROR_KIND);
    }

    const modifier = makeModifiersJson(target.modifier);
    if (member.type === 'statement') {
        return {
            type: 'statement',
            statement: makeStatementJson(member),
            modifier: modifier,
        };
    }

    const declaration = makeMemberDeclarationJson(member);
    if (declaration.kind === 'error') {
        return declaration;
    }
    return { ...declaration, modifier };
};

export type AnonymousUnitJson = {
    fileType: 'anonymous';
    block: BlockMemberJson[] | ErrorJson;
};

export const isAnonymousUnitJson = typia.createIs<AnonymousUnitJson>();

export const makeAnonymousUnitJson = (
    target: ConvertType<AnonymousUnitType>,
): AnonymousUnitJson | ErrorJson => {
    if (isErrorNode(target)) {
        return makeErrorJson(target, ERROR_KIND);
    }

    const block = target.value;
    return {
        fileType: 'anonymous',
        block: isErrorNode(block)
            ? makeErrorJson(block, ERROR_KIND)
            : block.value.map((b) => makeBlockMemberJson(b)),
    };
};

export type TriggerCaseJson = JsonType<'triggerCase'> & {
    actionType: 'INSERT' | 'UPDATE' | 'DELETE' | 'UNDELETE';
    timing: 'BEFORE' | 'AFTER';
};

const makeTriggerCaseJson = (target: ConvertType<TriggerCaseType>): TriggerCaseJson | ErrorJson => {
    return convertValue<'triggerCase', TriggerCaseType, TriggerCaseJson>(
        target,
        'triggerCase',
        (target, targetRecords) => {
            return makeJsonType('triggerCase', targetRecords.base, {
                actionType: target.triggerCaseType,
                timing: target.timing,
            });
        },
    );
};

// trigger 名・対象オブジェクトは構文エラーからの回復で欠けることがある
const makeTriggerNameJson = (
    target: ConvertType<IdType> | undefined,
    owner: ConvertType<TriggerUnitType>,
): string | ErrorJson => {
    if (!target) {
        return makeErrorJson(owner, ERROR_KIND);
    }
    return isErrorNode(target) ? makeErrorJson(target, ERROR_KIND) : target.value;
};

export type TriggerUnitJson = {
    fileType: 'trigger';
    name: string | ErrorJson;
    object: string | ErrorJson;
    case: (TriggerCaseJson | ErrorJson)[];
    block: BlockMemberJson[] | ErrorJson;
};

export const isTriggerUnitJson = typia.createIs<TriggerUnitJson>();

export const makeTriggerUnitJson = (
    target: ConvertType<TriggerUnitType>,
): TriggerUnitJson | ErrorJson => {
    if (isErrorNode(target)) {
        return makeErrorJson(target, ERROR_KIND);
    }

    const block = target.block;
    return {
        fileType: 'trigger',
        name: makeTriggerNameJson(target.value[0], target),
        object: makeTriggerNameJson(target.value[1], target),
        case: target.triggerCase.map((t) => makeTriggerCaseJson(t)),
        block: isErrorNode(block)
            ? makeErrorJson(block, ERROR_KIND)
            : block.value.map((b) => makeBlockMemberJson(b)),
    };
};

export type CompilationUnitJson = {
    fileType: 'cls';
} & (InterfaceDeclarationJson | ClassDeclarationJson | EnumDeclarationJson) & {
        modifier: ModifiersJson;
    };

export const isCompilationUnitJson = typia.createIs<CompilationUnitJson>();

export const makeCompilationUnitJson = (
    target: ConvertType<CompilationUnitType>,
): CompilationUnitJson | ErrorJson => {
    if (isErrorNode(target)) {
        return makeErrorJson(target, ERROR_KIND);
    }

    const typeDeclaration = target.value;
    if (isErrorNode(typeDeclaration)) {
        return makeErrorJson(typeDeclaration, ERROR_KIND);
    }

    const declaration = typeDeclaration.value;
    if (isErrorNode(declaration)) {
        return makeErrorJson(declaration, ERROR_KIND);
    }

    let content: InterfaceDeclarationJson | ClassDeclarationJson | EnumDeclarationJson | ErrorJson;
    if (declaration.type === 'classDeclaration') {
        content = makeClassDeclarationJson(declaration);
    } else if (declaration.type === 'interfaceDeclaration') {
        content = makeInterfaceDeclarationJson(declaration);
    } else {
        content = makeEnumDeclarationJson(declaration);
    }
    if (content.kind === 'error') {
        return content;
    }
    return {
        fileType: 'cls',
        ...content,
        modifier: makeModifiersJson(typeDeclaration.modifier),
    };
};

