import typia from 'typia';
import { ErrorJson, JsonType } from '../commons';

import type {
    AnonymousBlockMemberTypeClass,
    AnonymousUnitTypeClass,
    CompilationUnitTypeClass,
    TriggerBlockMemberTypeClass,
    TriggerCaseTypeClass,
    TriggerUnitTypeClass,
} from '../apex_IR_v2';
import { makeNodeJson } from './commons/node';
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
// v2 の木にはエラーのノードがないので、unit の中に ErrorJson は出てこない (型には今は残す)。
// ファイル全体を読めなかったとき (buildApexIr が木を返さなかったとき) は、呼び出す側 (parser/Apex/source.ts) が扱う

export type MemberStatementJson = {
    kind: 'statement';
    statement: StatementJson | ErrorJson;
    modifier: ModifiersJson;
};

type BlockMemberJson =
    (MemberDeclarationJson & { modifier: ModifiersJson }) | MemberStatementJson | ErrorJson;

const makeBlockMemberJson = (
    target: AnonymousBlockMemberTypeClass | TriggerBlockMemberTypeClass,
): BlockMemberJson => {
    const member = target.getFields();
    switch (member.kind) {
        // 文法上、文には修飾子が付かないので空の ModifiersJson にする (v1 と同じ)
        case 'statement':
            return {
                kind: 'statement',
                statement: makeStatementJson(member.statement),
                modifier: makeModifiersJson([]),
            };
        case 'declaration':
            return {
                ...makeMemberDeclarationJson(member.declaration),
                modifier: makeModifiersJson(member.modifiers),
            };
    }
};

export type AnonymousUnitJson = {
    fileType: 'anonymous';
    block: BlockMemberJson[] | ErrorJson;
};

export const isAnonymousUnitJson = typia.createIs<AnonymousUnitJson>();

export const makeAnonymousUnitJson = (target: AnonymousUnitTypeClass): AnonymousUnitJson => {
    return {
        fileType: 'anonymous',
        block: target
            .getFields()
            .block.getFields()
            .members.map((b) => makeBlockMemberJson(b)),
    };
};

export type TriggerCaseJson = JsonType<'triggerCase'> & {
    actionType: 'INSERT' | 'UPDATE' | 'DELETE' | 'UNDELETE';
    timing: 'BEFORE' | 'AFTER';
};

const makeTriggerCaseJson = (target: TriggerCaseTypeClass): TriggerCaseJson => {
    const { actionType, timing } = target.getFields();
    return makeNodeJson<TriggerCaseJson>('triggerCase', target, {
        actionType: actionType,
        timing: timing,
    });
};

export type TriggerUnitJson = {
    fileType: 'trigger';
    name: string | ErrorJson;
    object: string | ErrorJson;
    case: (TriggerCaseJson | ErrorJson)[];
    block: BlockMemberJson[] | ErrorJson;
};

export const isTriggerUnitJson = typia.createIs<TriggerUnitJson>();

export const makeTriggerUnitJson = (target: TriggerUnitTypeClass): TriggerUnitJson => {
    const { name, object, triggerCase, block } = target.getFields();
    return {
        fileType: 'trigger',
        name: name.getFields().value,
        object: object.getFields().value,
        case: triggerCase.map((t) => makeTriggerCaseJson(t)),
        block: block.getFields().member.map((b) => makeBlockMemberJson(b)),
    };
};

export type CompilationUnitJson = {
    fileType: 'cls';
} & (InterfaceDeclarationJson | ClassDeclarationJson | EnumDeclarationJson) & {
        modifier: ModifiersJson;
    };

export const isCompilationUnitJson = typia.createIs<CompilationUnitJson>();

const makeTypeDeclarationContentJson = (
    target: CompilationUnitTypeClass,
): InterfaceDeclarationJson | ClassDeclarationJson | EnumDeclarationJson => {
    const declaration = target.getFields().declaration.getFields().declaration;
    switch (declaration.kind) {
        case 'classDeclaration':
            return makeClassDeclarationJson(declaration);
        case 'interfaceDeclaration':
            return makeInterfaceDeclarationJson(declaration);
        case 'enumDeclaration':
            return makeEnumDeclarationJson(declaration);
    }
};

export const makeCompilationUnitJson = (target: CompilationUnitTypeClass): CompilationUnitJson => {
    return {
        fileType: 'cls',
        ...makeTypeDeclarationContentJson(target),
        modifier: makeModifiersJson(target.getFields().declaration.getFields().modifiers),
    };
};
