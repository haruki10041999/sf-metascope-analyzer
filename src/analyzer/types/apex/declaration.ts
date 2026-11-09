import typia from 'typia';

import { ConvertKeys, ErrorJson, JsonType, StructureJsonType, makeStructureJson } from '../commons';

import type {
    AnonymousMemberDeclarationTypeClass,
    ClassDeclarationTypeClass,
    ConstructorDeclarationTypeClass,
    EnumDeclarationTypeClass,
    FieldDeclarationTypeClass,
    FormalParametersTypeClass,
    IdTypeClass,
    InterfaceDeclarationTypeClass,
    InterfaceMethodDeclarationTypeClass,
    LocalVariableDeclarationTypeClass,
    MemberDeclarationTypeClass,
    MethodDeclarationTypeClass,
    PropertyDeclarationTypeClass,
    TriggerMemberDeclarationTypeClass,
    TypeListTypeClass,
    TypeRefTypeClass,
    VariableDeclaratorsTypeClass,
} from '../apex_IR_v2';

import { keysOf, makeNodeJson, structureKeysOf } from './commons/node';
import { BaseExpressionJson, makeExpressionJsonConvert } from './expression';
import { TypeJson, makeTypeJson } from './type';
import { ModifiersJson, makeModifiersJson } from './modifier';
import { ParameterJson, makeParameterJson } from './param';
import { StatementJson, makeBlockJson } from './statement';

/**
 * 本体を持つ宣言は StructureJsonType。sourceKeys には、宣言全体 (base) と名前 (name) の位置を持つ。
 * v2 の木にはエラーのノードがないので、v1 のような部分木のエラーの検査はしない
 */
type DeclarationKeys = { name: ConvertKeys };

const makeNameJson = (target: IdTypeClass): string => target.getFields().value;

// 引数がなければ (`()`) null
const makeParametersJson = (target: FormalParametersTypeClass): ParameterJson[] | null => {
    const list = target.getFields().parameterList;
    return list ? list.getFields().value.map((p) => makeParameterJson(p)) : null;
};

const makeTypeListJson = (target: TypeListTypeClass): TypeJson[] =>
    target.getFields().value.map((t) => makeTypeJson(t));

// 戻り値の型。void は文字列のまま
const makeReturnTypeJson = (target: TypeRefTypeClass | 'void'): 'void' | TypeJson =>
    target === 'void' ? target : makeTypeJson(target);

/** 変数 (1 つの宣言に複数あるので kind を持たない値)。使われていない変数などの位置のために sourceKeys を持つ */
export type VariantJson = {
    sourceKeys: ConvertKeys;
    name: string | ErrorJson;
    init?: BaseExpressionJson | ErrorJson;
};

const makeVariantsJson = (target: VariableDeclaratorsTypeClass): VariantJson[] =>
    target.getFields().element.map((v) => {
        const { variant, init } = v.getFields();
        return {
            sourceKeys: keysOf(v),
            name: makeNameJson(variant),
            ...(init ? { init: makeExpressionJsonConvert(init) } : {}),
        };
    });

export type MethodDeclarationJson = StructureJsonType<'method', DeclarationKeys> & {
    name: string | ErrorJson;
    returnType: 'void' | TypeJson | ErrorJson;
    param?: (ParameterJson | ErrorJson)[] | ErrorJson;
    block?: (StatementJson | ErrorJson)[];
};

export const isMethodDeclarationJson = typia.createIs<MethodDeclarationJson>();

export const makeMethodDeclarationJson = (
    target: MethodDeclarationTypeClass,
): MethodDeclarationJson => {
    const { name, returnType, parameters, block } = target.getFields();
    const param = makeParametersJson(parameters);
    return makeStructureJson('method', structureKeysOf<DeclarationKeys>(target, { name }), {
        name: makeNameJson(name),
        returnType: makeReturnTypeJson(returnType),
        ...(param ? { param: param } : {}),
        // abstract メソッドは本体を持たない
        ...(block ? { block: makeBlockJson(block) } : {}),
    });
};

export type InterfaceMethodJson = StructureJsonType<'interfaceMethod', DeclarationKeys> & {
    name: string | ErrorJson;
    returnType: 'void' | TypeJson | ErrorJson;
    param?: (ParameterJson | ErrorJson)[] | ErrorJson;
    modifier: ModifiersJson;
};

const makeInterfaceMethodJson = (
    target: InterfaceMethodDeclarationTypeClass,
): InterfaceMethodJson => {
    const { name, returnType, parameters, modifiers } = target.getFields();
    const param = makeParametersJson(parameters);
    return makeStructureJson(
        'interfaceMethod',
        structureKeysOf<DeclarationKeys>(target, { name }),
        {
            name: makeNameJson(name),
            returnType: makeReturnTypeJson(returnType),
            ...(param ? { param: param } : {}),
            modifier: makeModifiersJson(modifiers),
        },
    );
};

export type InterfaceDeclarationJson = StructureJsonType<'interface', DeclarationKeys> & {
    name: string | ErrorJson;
    block?: (InterfaceMethodJson | ErrorJson)[] | ErrorJson;
    extend?: (TypeJson | ErrorJson)[] | ErrorJson;
};

export const isInterfaceDeclarationJson = typia.createIs<InterfaceDeclarationJson>();

export const makeInterfaceDeclarationJson = (
    target: InterfaceDeclarationTypeClass,
): InterfaceDeclarationJson => {
    const { name, extend, body } = target.getFields();
    return makeStructureJson('interface', structureKeysOf<DeclarationKeys>(target, { name }), {
        name: makeNameJson(name),
        block: body.getFields().declaration.map((b) => makeInterfaceMethodJson(b)),
        ...(extend ? { extend: makeTypeListJson(extend) } : {}),
    });
};

export type InitializerBlockJson = {
    kind: 'initializer';
    block: (StatementJson | ErrorJson)[];
    modifier: ModifiersJson;
    isStatic: boolean;
};

export type NotSetBlockJson = JsonType<'notSet'>;

type ClassBlockJson =
    | InitializerBlockJson
    | (FieldDeclarationJson & { modifier: ModifiersJson })
    | (PropertyDeclarationJson & { modifier: ModifiersJson })
    | (EnumDeclarationJson & { modifier: ModifiersJson })
    | (MethodDeclarationJson & { modifier: ModifiersJson })
    | (InterfaceDeclarationJson & { modifier: ModifiersJson })
    | (ConstructorDeclarationJson & { modifier: ModifiersJson })
    | (ClassDeclarationJson & { modifier: ModifiersJson })
    | NotSetBlockJson
    | ErrorJson;

export type ClassDeclarationJson = StructureJsonType<'class', DeclarationKeys> & {
    name: string | ErrorJson;
    block: ClassBlockJson[];
    extend?: TypeJson | ErrorJson;
    implement?: (TypeJson | ErrorJson)[] | ErrorJson;
};

export const isClassDeclarationJson = typia.createIs<ClassDeclarationJson>();

export const makeClassDeclarationJson = (
    target: ClassDeclarationTypeClass,
): ClassDeclarationJson => {
    const { name, extend, implement, body } = target.getFields();
    const block = body.getFields().declaration.map((b): ClassBlockJson => {
        const member = b.getFields();
        switch (member.kind) {
            // 単独の `;` (文法上許される空の宣言)。キーは classBodyDeclaration のもの
            case 'empty':
                return makeNodeJson<NotSetBlockJson>('notSet', b);
            // 初期化ブロック (`static? { ... }`)。文法上、修飾子は付かないので空の ModifiersJson にする (v1 と同じ)
            case 'initializer':
                return {
                    kind: 'initializer',
                    block: makeBlockJson(member.block),
                    modifier: makeModifiersJson([]),
                    isStatic: member.isStatic,
                };
            case 'member':
                return {
                    ...makeMemberDeclarationJson(member.declaration),
                    modifier: makeModifiersJson(member.modifiers),
                };
        }
    });
    return makeStructureJson('class', structureKeysOf<DeclarationKeys>(target, { name }), {
        name: makeNameJson(name),
        block: block,
        ...(extend ? { extend: makeTypeJson(extend) } : {}),
        ...(implement ? { implement: makeTypeListJson(implement) } : {}),
    });
};

export type EnumConstantJson = JsonType<'enumConstant'> & {
    name: string;
};

// キーは定数の id のもの
const makeEnumConstantJson = (target: IdTypeClass): EnumConstantJson =>
    makeNodeJson<EnumConstantJson>('enumConstant', target, { name: makeNameJson(target) });

export type EnumDeclarationJson = StructureJsonType<'enum', DeclarationKeys> & {
    name: string | ErrorJson;
    members?: (EnumConstantJson | ErrorJson)[] | ErrorJson;
};

export const isEnumDeclarationJson = typia.createIs<EnumDeclarationJson>();

export const makeEnumDeclarationJson = (target: EnumDeclarationTypeClass): EnumDeclarationJson => {
    const { name, constants } = target.getFields();
    return makeStructureJson('enum', structureKeysOf<DeclarationKeys>(target, { name }), {
        name: makeNameJson(name),
        // `enum E {}` のように定数がなければ members を持たない
        ...(constants
            ? { members: constants.getFields().constants.map((m) => makeEnumConstantJson(m)) }
            : {}),
    });
};

export type AccessorContentJson = {
    block?: (StatementJson | ErrorJson)[];
    modifier: ModifiersJson;
};

export type PropertyDeclarationJson = StructureJsonType<'property', DeclarationKeys> & {
    name: string | ErrorJson;
    variantType: TypeJson | ErrorJson;
    isGetter: boolean;
    getterContent?: AccessorContentJson;
    isSetter: boolean;
    setterContent?: AccessorContentJson;
    // 取り出せなかった getter / setter (v2 の木にはエラーのノードがないので、今は出てこない)
    error?: ErrorJson[];
};

export const isPropertyDeclarationJson = typia.createIs<PropertyDeclarationJson>();

export const makePropertyDeclarationJson = (
    target: PropertyDeclarationTypeClass,
): PropertyDeclarationJson => {
    const { name, valueType, blocks } = target.getFields();
    let getterContent: AccessorContentJson | undefined = undefined;
    let setterContent: AccessorContentJson | undefined = undefined;

    // getter・setter が文法上重なって書かれたときは、あとのものにする (v1 と同じ)
    blocks.forEach((b) => {
        const { block: accessor, modifiers } = b.getFields();
        // `get;`・`set;` (自動プロパティ) は本体を持たない
        const accessorBlock = accessor.getFields().block;
        const content: AccessorContentJson = {
            ...(accessorBlock ? { block: makeBlockJson(accessorBlock) } : {}),
            modifier: makeModifiersJson(modifiers),
        };
        if (accessor.kind === 'getter') {
            getterContent = content;
        } else {
            setterContent = content;
        }
    });

    return makeStructureJson('property', structureKeysOf<DeclarationKeys>(target, { name }), {
        name: makeNameJson(name),
        variantType: makeTypeJson(valueType),
        isGetter: getterContent !== undefined,
        ...(getterContent ? { getterContent: getterContent } : {}),
        isSetter: setterContent !== undefined,
        ...(setterContent ? { setterContent: setterContent } : {}),
    });
};

// field は本体を持たないので StructureJsonType にしない (ローカル変数の文と同じ扱い)
export type FieldDeclarationJson = JsonType<'field'> & {
    variants: (VariantJson | ErrorJson)[] | ErrorJson;
    variantType: TypeJson | ErrorJson;
};

export const isFieldDeclarationJson = typia.createIs<FieldDeclarationJson>();

export const makeFieldDeclarationJson = (
    target: FieldDeclarationTypeClass,
): FieldDeclarationJson => {
    const { declarators, valueType } = target.getFields();
    return makeNodeJson<FieldDeclarationJson>('field', target, {
        variants: makeVariantsJson(declarators),
        variantType: makeTypeJson(valueType),
    });
};

export type ConstructorDeclarationJson = StructureJsonType<'constructor', DeclarationKeys> & {
    name: (string | ErrorJson)[] | ErrorJson;
    param?: (ParameterJson | ErrorJson)[] | ErrorJson;
    block: (StatementJson | ErrorJson)[];
};

export const isConstructorDeclarationJson = typia.createIs<ConstructorDeclarationJson>();

export const makeConstructorDeclarationJson = (
    target: ConstructorDeclarationTypeClass,
): ConstructorDeclarationJson => {
    const { name, parameters, block } = target.getFields();
    const param = makeParametersJson(parameters);
    // name の位置は、修飾された名前 (qualifiedName) 全体のもの
    return makeStructureJson('constructor', structureKeysOf<DeclarationKeys>(target, { name }), {
        name: name.getFields().value.map((v) => makeNameJson(v)),
        ...(param ? { param: param } : {}),
        block: makeBlockJson(block),
    });
};

export type LocalVariableDeclarationJson = {
    variants: (VariantJson | ErrorJson)[] | ErrorJson;
    variantsType: TypeJson | ErrorJson;
    modifier: ModifiersJson;
};

export const isLocalVariableDeclarationJson = typia.createIs<LocalVariableDeclarationJson>();

export const makeLocalVariableDeclarationJson = (
    target: LocalVariableDeclarationTypeClass,
): LocalVariableDeclarationJson => {
    const { declarators, valueType, modifiers } = target.getFields();
    return {
        variants: makeVariantsJson(declarators),
        variantsType: makeTypeJson(valueType),
        modifier: makeModifiersJson(modifiers),
    };
};

export type MemberDeclarationJson =
    | MethodDeclarationJson
    | InterfaceDeclarationJson
    | ClassDeclarationJson
    | EnumDeclarationJson
    | PropertyDeclarationJson
    | FieldDeclarationJson
    | ConstructorDeclarationJson;

// memberDeclaration・anonymousMemberDeclaration・triggerMemberDeclaration は包むだけのノードなので、中の宣言を JSON にする
export const makeMemberDeclarationJson = (
    target:
        | MemberDeclarationTypeClass
        | AnonymousMemberDeclarationTypeClass
        | TriggerMemberDeclarationTypeClass,
): MemberDeclarationJson => {
    const declaration = target.getFields().declaration;
    switch (declaration.kind) {
        case 'methodDeclaration':
            return makeMethodDeclarationJson(declaration);
        case 'interfaceDeclaration':
            return makeInterfaceDeclarationJson(declaration);
        case 'classDeclaration':
            return makeClassDeclarationJson(declaration);
        case 'enumDeclaration':
            return makeEnumDeclarationJson(declaration);
        case 'propertyDeclaration':
            return makePropertyDeclarationJson(declaration);
        case 'fieldDeclaration':
            return makeFieldDeclarationJson(declaration);
        case 'constructorDeclaration':
            return makeConstructorDeclarationJson(declaration);
    }
};
