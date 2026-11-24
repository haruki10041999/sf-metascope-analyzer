import { JsonType } from '../commons';

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

import { type ApexNode, keysOf, makeDerivedNodeJson, makeNodeJson } from './commons/node';
import { BaseExpressionJson, makeExpressionJsonConvert } from './expression';
import { TypeJson, makeTypeJson } from './type';
import { ModifiersJson, makeModifiersJson } from './modifier';
import { ParameterJson, makeParameterJson } from './param';
import { StatementJson, makeBlockJson } from './statement';

/**
 * 本体を持つ宣言も JsonType (apex 9 から)。sourceKeys は宣言全体の位置、名前の位置は nameRef (declarationName) に持つ。
 * v2 の木にはエラーのノードがないので、v1 のような部分木のエラーの検査はしない
 */
/**
 * 宣言の名前の位置 (名前そのものは宣言の name にも文字列で持つ。docs/plan.md 4.2)。
 * コンストラクターの名前 (修飾された名前) は . でつないだもの
 */
export type DeclarationNameJson = JsonType<'declarationName'> & { name: string };

// 名前の IR (id) の objectKey は名前の文字列だけから作られ、式の識別子 (identifier) と同じキーになるので、
// objectKey は kind を含めて中身から作る (位置は名前の IR のもの)
const makeDeclarationNameJson = (target: ApexNode, name: string): DeclarationNameJson =>
    makeDerivedNodeJson<DeclarationNameJson>('declarationName', target, { name });

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

export type MethodDeclarationJson = JsonType<'method'> & {
    /** 名前の位置 */
    nameRef: DeclarationNameJson;
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
    return makeNodeJson<MethodDeclarationJson>('method', target, {
        nameRef: makeDeclarationNameJson(name, makeNameJson(name)),
        name: makeNameJson(name),
        returnType: makeReturnTypeJson(returnType),
        param: param,
        // abstract メソッドは本体を持たない
        ...(block ? { block: makeBlockJson(block) } : {}),
    });
};

export type InterfaceMethodJson = JsonType<'interfaceMethod'> & {
    /** 名前の位置 */
    nameRef: DeclarationNameJson;
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
    return makeNodeJson<InterfaceMethodJson>('interfaceMethod', target, {
        nameRef: makeDeclarationNameJson(name, makeNameJson(name)),
        name: makeNameJson(name),
        returnType: makeReturnTypeJson(returnType),
        param: param,
        modifier: makeModifiersJson(target, modifiers),
    });
};

export type InterfaceDeclarationJson = JsonType<'interface'> & {
    /** 名前の位置 */
    nameRef: DeclarationNameJson;
    name: string;
    block?: InterfaceMethodJson[];
    extend?: TypeJson[];
};

export const makeInterfaceDeclarationJson = (
    target: InterfaceDeclarationTypeClass,
): InterfaceDeclarationJson => {
    const { name, extend, body } = target.getFields();
    return makeNodeJson<InterfaceDeclarationJson>('interface', target, {
        nameRef: makeDeclarationNameJson(name, makeNameJson(name)),
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

export type ClassDeclarationJson = JsonType<'class'> & {
    /** 名前の位置 */
    nameRef: DeclarationNameJson;
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
                    modifier: makeModifiersJson(b, member.modifiers),
                };
        }
    });
    return makeNodeJson<ClassDeclarationJson>('class', target, {
        nameRef: makeDeclarationNameJson(name, makeNameJson(name)),
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

export type EnumDeclarationJson = JsonType<'enum'> & {
    /** 名前の位置 */
    nameRef: DeclarationNameJson;
    name: string;
    members?: EnumConstantJson[];
};

export const makeEnumDeclarationJson = (target: EnumDeclarationTypeClass): EnumDeclarationJson => {
    const { name, constants } = target.getFields();
    return makeNodeJson<EnumDeclarationJson>('enum', target, {
        nameRef: makeDeclarationNameJson(name, makeNameJson(name)),
        name: makeNameJson(name),
        // `enum E {}` のように定数がなければ members を持たない
        ...(constants
            ? { members: constants.getFields().constants.map((m) => makeEnumConstantJson(m)) }
            : {}),
    });
};

/** プロパティの get / set 1 つ。`get;`・`set;` (自動プロパティ) は本体を持たない */
export type AccessorContentJson = JsonType<'accessor'> & {
    block?: StatementJson[];
    modifier: ModifiersJson;
};

export type PropertyDeclarationJson = JsonType<'property'> & {
    /** 名前の位置 */
    nameRef: DeclarationNameJson;
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
        const content = makeNodeJson<AccessorContentJson>('accessor', b, {
            ...(accessorBlock ? { block: makeBlockJson(accessorBlock) } : {}),
            modifier: makeModifiersJson(b, modifiers),
        });
        if (accessor.kind === 'getter') {
            getterContent = content;
        } else {
            setterContent = content;
        }
    });

    return makeNodeJson<PropertyDeclarationJson>('property', target, {
        nameRef: makeDeclarationNameJson(name, makeNameJson(name)),
        name: makeNameJson(name),
        variantType: makeTypeJson(valueType),
        isGetter: getterContent !== undefined,
        ...(getterContent ? { getterContent: getterContent } : {}),
        isSetter: setterContent !== undefined,
        ...(setterContent ? { setterContent: setterContent } : {}),
    });
};

// field は名前を variants に持つので nameRef を持たない (ローカル変数の文と同じ扱い)
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

export type ConstructorDeclarationJson = JsonType<'constructor'> & {
    /** 名前の位置 */
    nameRef: DeclarationNameJson;
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
    return makeNodeJson<ConstructorDeclarationJson>('constructor', target, {
        nameRef: makeDeclarationNameJson(
            name,
            name
                .getFields()
                .value.map((v) => makeNameJson(v))
                .join('.'),
        ),
        name: name.getFields().value.map((v) => makeNameJson(v)),
        param: param,
        block: makeBlockJson(block),
    });
};

/**
 * ローカル変数の宣言の中身 (localVariable の文に展開する)。型は項目と同じ名前 (variantType)。
 * 通常の for の初期化に単独で置くときは LocalVariableDeclarationJson (ノード)
 */
export type LocalVariableDeclarationBody = {
    variants: VariantJson[];
    variantType: TypeJson;
    modifier: ModifiersJson;
};

/** 通常の for の初期化のローカル変数の宣言 */
export type LocalVariableDeclarationJson = JsonType<'localVariableDeclaration'> &
    LocalVariableDeclarationBody;

export const makeLocalVariableDeclarationBody = (
    target: LocalVariableDeclarationTypeClass,
): LocalVariableDeclarationBody => {
    const { declarators, valueType, modifiers } = target.getFields();
    return {
        variantType: makeTypeJson(valueType),
        modifier: makeModifiersJson(target, modifiers),
        variants: makeVariantsJson(declarators),
    };
};

export const makeLocalVariableDeclarationJson = (
    target: LocalVariableDeclarationTypeClass,
): LocalVariableDeclarationJson =>
    makeNodeJson<LocalVariableDeclarationJson>(
        'localVariableDeclaration',
        target,
        makeLocalVariableDeclarationBody(target),
    );

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
