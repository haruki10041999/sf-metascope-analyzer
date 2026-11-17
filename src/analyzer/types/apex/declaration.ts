import { ConvertKeys, JsonType, StructureJsonType, makeStructureJson } from '../commons';

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
} from '../apex_IR';

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

// 引数がなければ (`()`) 空の配列 (LWC の param と同じく、いつも配列)
const makeParametersJson = (target: FormalParametersTypeClass): ParameterJson[] => {
    const list = target.getFields().parameterList;
    return list ? list.getFields().value.map((p) => makeParameterJson(p)) : [];
};

const makeTypeListJson = (target: TypeListTypeClass): TypeJson[] =>
    target.getFields().value.map((t) => makeTypeJson(t));

// 戻り値の型。void は文字列のまま
const makeReturnTypeJson = (target: TypeRefTypeClass | 'void'): 'void' | TypeJson =>
    target === 'void' ? target : makeTypeJson(target);

/** 変数 (項目・ローカル変数の 1 つ)。kind と位置を持つ (docs/json-redesign-plan.md の段階 A4。LWC の jsVariant) */
export type VariantJson = JsonType<'variant'> & {
    name: string;
    init?: BaseExpressionJson;
};

const makeVariantsJson = (target: VariableDeclaratorsTypeClass): VariantJson[] =>
    target.getFields().element.map((v) => {
        const { variant, init } = v.getFields();
        return makeNodeJson<VariantJson>('variant', v, {
            name: makeNameJson(variant),
            ...(init ? { init: makeExpressionJsonConvert(init) } : {}),
        });
    });

export type MethodDeclarationJson = StructureJsonType<'method', DeclarationKeys> & {
    name: string;
    returnType: 'void' | TypeJson;
    /** 引数 (書いた順)。なければ空 */
    param: ParameterJson[];
    block?: StatementJson[];
};

export const makeMethodDeclarationJson = (
    target: MethodDeclarationTypeClass,
): MethodDeclarationJson => {
    const { name, returnType, parameters, block } = target.getFields();
    const param = makeParametersJson(parameters);
    return makeStructureJson('method', structureKeysOf<DeclarationKeys>(target, { name }), {
        name: makeNameJson(name),
        returnType: makeReturnTypeJson(returnType),
        param: param,
        // abstract メソッドは本体を持たない
        ...(block ? { block: makeBlockJson(block) } : {}),
    });
};

export type InterfaceMethodJson = StructureJsonType<'interfaceMethod', DeclarationKeys> & {
    name: string;
    returnType: 'void' | TypeJson;
    /** 引数 (書いた順)。なければ空 */
    param: ParameterJson[];
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
            param: param,
            modifier: makeModifiersJson(modifiers),
        },
    );
};

export type InterfaceDeclarationJson = StructureJsonType<'interface', DeclarationKeys> & {
    name: string;
    block?: InterfaceMethodJson[];
    extend?: TypeJson[];
};

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

/** 初期化ブロック (`static? { ... }`)。境界ノード (kind と sourceKeys)。文法上、修飾子は付かない (段階 A5) */
export type InitializerBlockJson = JsonType<'initializer'> & {
    block: StatementJson[];
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
    | NotSetBlockJson;

export type ClassDeclarationJson = StructureJsonType<'class', DeclarationKeys> & {
    name: string;
    block: ClassBlockJson[];
    extend?: TypeJson;
    implement?: TypeJson[];
};

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
            // 初期化ブロック (`static? { ... }`)。キーは classBodyDeclaration のもの
            case 'initializer':
                return makeNodeJson<InitializerBlockJson>('initializer', b, {
                    block: makeBlockJson(member.block),
                    isStatic: member.isStatic,
                });
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
    name: string;
    members?: EnumConstantJson[];
};

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
    block?: StatementJson[];
    modifier: ModifiersJson;
};

export type PropertyDeclarationJson = StructureJsonType<'property', DeclarationKeys> & {
    name: string;
    variantType: TypeJson;
    isGetter: boolean;
    getterContent?: AccessorContentJson;
    isSetter: boolean;
    setterContent?: AccessorContentJson;
};

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
    variants: VariantJson[];
    variantType: TypeJson;
};

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
    name: string[];
    /** 引数 (書いた順)。なければ空 */
    param: ParameterJson[];
    block: StatementJson[];
};

export const makeConstructorDeclarationJson = (
    target: ConstructorDeclarationTypeClass,
): ConstructorDeclarationJson => {
    const { name, parameters, block } = target.getFields();
    const param = makeParametersJson(parameters);
    // name の位置は、修飾された名前 (qualifiedName) 全体のもの
    return makeStructureJson('constructor', structureKeysOf<DeclarationKeys>(target, { name }), {
        name: name.getFields().value.map((v) => makeNameJson(v)),
        param: param,
        block: makeBlockJson(block),
    });
};

/** ローカル変数の宣言 (localVariable の文と、通常の for の初期化)。型は項目と同じ名前 (variantType) */
export type LocalVariableDeclarationJson = {
    variants: VariantJson[];
    variantType: TypeJson;
    modifier: ModifiersJson;
};

export const makeLocalVariableDeclarationJson = (
    target: LocalVariableDeclarationTypeClass,
): LocalVariableDeclarationJson => {
    const { declarators, valueType, modifiers } = target.getFields();
    return {
        variantType: makeTypeJson(valueType),
        modifier: makeModifiersJson(modifiers),
        variants: makeVariantsJson(declarators),
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
