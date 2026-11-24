import { JsonType } from '../commons';

import type {
    AnonymousBlockMemberTypeClass,
    AnonymousUnitTypeClass,
    CompilationUnitTypeClass,
    TriggerBlockMemberTypeClass,
    TriggerCaseTypeClass,
    TriggerUnitTypeClass,
} from '../apex_IR';
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

// トリガー・匿名 Apex の中身は triggerUnit・anonymousUnit のノード (apex 9 から)。クラスの中身は宣言 (class など) のノード。
// IR の木にはエラーのノードがないので、unit の中にエラーのノードは出てこない (エラーは resolvedError に出る)。
// ファイル全体を読めなかったとき (buildApexIr が木を返さなかったとき) は、呼び出す側 (parser/Apex/source.ts) が扱う

/**
 * トリガー・匿名 Apex の本文の要素。宣言は修飾子を持ち、文はそのまま置く
 * (文を包む入れ物 MemberStatementJson は段階 A5 でなくした。文法上、文に修飾子は付かない)
 */
export type BlockMemberJson = (MemberDeclarationJson & { modifier: ModifiersJson }) | StatementJson;

const makeBlockMemberJson = (
    target: AnonymousBlockMemberTypeClass | TriggerBlockMemberTypeClass,
): BlockMemberJson => {
    const member = target.getFields();
    switch (member.kind) {
        case 'statement':
            return makeStatementJson(member.statement);
        case 'declaration':
            return {
                ...makeMemberDeclarationJson(member.declaration),
                modifier: makeModifiersJson(target, member.modifiers),
            };
    }
};

export type AnonymousUnitJson = JsonType<'anonymousUnit'> & {
    fileType: 'anonymous';
    block: BlockMemberJson[];
};

export const makeAnonymousUnitJson = (target: AnonymousUnitTypeClass): AnonymousUnitJson =>
    makeNodeJson<AnonymousUnitJson>('anonymousUnit', target, {
        fileType: 'anonymous',
        block: target
            .getFields()
            .block.getFields()
            .members.map((b) => makeBlockMemberJson(b)),
    });

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

export type TriggerUnitJson = JsonType<'triggerUnit'> & {
    fileType: 'trigger';
    name: string;
    object: string;
    case: TriggerCaseJson[];
    block: BlockMemberJson[];
};

export const makeTriggerUnitJson = (target: TriggerUnitTypeClass): TriggerUnitJson => {
    const { name, object, triggerCase, block } = target.getFields();
    return makeNodeJson<TriggerUnitJson>('triggerUnit', target, {
        fileType: 'trigger',
        name: name.getFields().value,
        object: object.getFields().value,
        case: triggerCase.map((t) => makeTriggerCaseJson(t)),
        block: block.getFields().member.map((b) => makeBlockMemberJson(b)),
    });
};

export type CompilationUnitJson = {
    fileType: 'cls';
} & (InterfaceDeclarationJson | ClassDeclarationJson | EnumDeclarationJson) & {
        modifier: ModifiersJson;
    };

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
        modifier: makeModifiersJson(
            target.getFields().declaration,
            target.getFields().declaration.getFields().modifiers,
        ),
    };
};
