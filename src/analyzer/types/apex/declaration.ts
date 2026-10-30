import typia from 'typia';

import {
    ConvertKeys,
    ConvertType,
    ConvertWithError,
    ErrorJson,
    JsonType,
    StructureJson,
    convertValue,
    isErrorNode,
    makeErrorJson,
    makeJsonType,
    makeStructureJson,
} from './commons';

import {
    AnonymousMemberDeclarationType,
    LocalVariableDeclarationType,
    MethodDeclarationType,
    InterfaceDeclarationType,
    InterfaceMethodDeclarationType,
    ClassDeclarationType,
    MemberDeclarationType,
    EnumDeclarationType,
    PropertyDeclarationType,
    FieldDeclarationType,
    ConstructorDeclarationType,
    FormalParametersType,
    IdType,
    TriggerMemberDeclarationType,
    TypeListType,
    VariableDeclaratorsType,
} from './converter';
import { BaseExpressionJson, makeExpressionJsonConvert } from './expression';
import { TypeJson, makeTypeJson } from './type';
import { ModifiersJson, makeModifiersJson } from './modifier';
import { ParameterJson, makeParameterJson } from './param';
import { StatementJson, makeBlockJson } from './statement';

const ERROR_KIND = 'declaration';

/**
 * 宣言は境界ノード。field は初期値まで含めて部分木全体を検査し、
 * それ以外（本体を持つ宣言）はノード自身だけを検査する。本体・引数・型は子の変換関数がエラーを処理する。
 * StructureJson の sourceKeys には、宣言全体（base）と名前（name）の位置を持つ。
 */
const DECLARATION_OPTIONS = { exclude: 'children', record: { name: 'value' } } as const;

const makeNameJson = (target: ConvertType<IdType>): string | ErrorJson => {
    return isErrorNode(target) ? makeErrorJson(target, ERROR_KIND) : target.value;
};

const makeParametersJson = (
    target: ConvertType<FormalParametersType>,
): (ParameterJson | ErrorJson)[] | ErrorJson | null => {
    if (isErrorNode(target)) {
        return makeErrorJson(target, ERROR_KIND);
    }

    const list = target.value;
    if (!list) {
        return null;
    }
    if (isErrorNode(list)) {
        return makeErrorJson(list, ERROR_KIND);
    }
    return list.value.map((p) => makeParameterJson(p));
};

const makeTypeListJson = (
    target: ConvertType<TypeListType>,
): (TypeJson | ErrorJson)[] | ErrorJson => {
    if (isErrorNode(target)) {
        return makeErrorJson(target, ERROR_KIND);
    }
    return target.value.map((t) => makeTypeJson(t));
};

type VariantJson = {
    name: string | ErrorJson;
    init?: BaseExpressionJson | ErrorJson;
};

const makeVariantsJson = (
    target: ConvertType<VariableDeclaratorsType>,
): (VariantJson | ErrorJson)[] | ErrorJson => {
    if (isErrorNode(target)) {
        return makeErrorJson(target, ERROR_KIND);
    }

    return target.value.map((v) => {
        if (isErrorNode(v)) {
            return makeErrorJson(v, ERROR_KIND);
        }
        return {
            name: makeNameJson(v.value),
            ...(v.init ? { init: makeExpressionJsonConvert(v.init) } : {}),
        };
    });
};

export type MethodDeclarationJson = StructureJson<'method', { name: ConvertKeys }> & {
    name: string | ErrorJson;
    returnType: 'void' | TypeJson | ErrorJson;
    param?: (ParameterJson | ErrorJson)[] | ErrorJson;
    block?: (StatementJson | ErrorJson)[];
};

export const isMethodDeclarationJson = typia.createIs<MethodDeclarationJson>();

export const makeMethodDeclarationJson = (
    target: ConvertType<MethodDeclarationType>,
): MethodDeclarationJson | ErrorJson => {
    return convertValue<
        'methodDeclaration',
        MethodDeclarationType,
        MethodDeclarationJson,
        { name: ConvertKeys }
    >(
        target,
        'method',
        (method: ConvertWithError<MethodDeclarationType>, targetRecords) => {
            const param = method.param ? makeParametersJson(method.param) : null;
            return makeStructureJson('method', targetRecords, {
                name: makeNameJson(method.value),
                returnType:
                    method.valueType === 'void' ? method.valueType : makeTypeJson(method.valueType),
                ...(param ? { param: param } : {}),
                ...(method.block ? { block: makeBlockJson(method.block) } : {}),
            });
        },
        DECLARATION_OPTIONS,
    );
};

type InterfaceMethodJson = StructureJson<'interfaceMethod', { name: ConvertKeys }> & {
    name: string | ErrorJson;
    returnType: 'void' | TypeJson | ErrorJson;
    param?: (ParameterJson | ErrorJson)[] | ErrorJson;
    modifier: ModifiersJson;
};

const makeInterfaceMethodJson = (
    target: ConvertType<InterfaceMethodDeclarationType>,
): InterfaceMethodJson | ErrorJson => {
    return convertValue<
        'interfaceMethodDeclaration',
        InterfaceMethodDeclarationType,
        InterfaceMethodJson,
        { name: ConvertKeys }
    >(
        target,
        'interfaceMethod',
        (method: ConvertWithError<InterfaceMethodDeclarationType>, targetRecords) => {
            const param = method.param ? makeParametersJson(method.param) : null;
            return makeStructureJson('interfaceMethod', targetRecords, {
                name: makeNameJson(method.value),
                returnType:
                    method.valueType === 'void' ? method.valueType : makeTypeJson(method.valueType),
                ...(param ? { param: param } : {}),
                modifier: makeModifiersJson(method.modifier),
            });
        },
        DECLARATION_OPTIONS,
    );
};

export type InterfaceDeclarationJson = StructureJson<'interface', { name: ConvertKeys }> & {
    name: string | ErrorJson;
    block?: (InterfaceMethodJson | ErrorJson)[] | ErrorJson;
    extend?: (TypeJson | ErrorJson)[] | ErrorJson;
};

export const isInterfaceDeclarationJson = typia.createIs<InterfaceDeclarationJson>();

export const makeInterfaceDeclarationJson = (
    target: ConvertType<InterfaceDeclarationType>,
): InterfaceDeclarationJson | ErrorJson => {
    return convertValue<
        'interfaceDeclaration',
        InterfaceDeclarationType,
        InterfaceDeclarationJson,
        { name: ConvertKeys }
    >(
        target,
        'interface',
        (declaration: ConvertWithError<InterfaceDeclarationType>, targetRecords) => {
            const body = declaration.body;
            return makeStructureJson('interface', targetRecords, {
                name: makeNameJson(declaration.value),
                block: isErrorNode(body)
                    ? makeErrorJson(body, ERROR_KIND)
                    : body.value.map((b) => makeInterfaceMethodJson(b)),
                ...(declaration.extend ? { extend: makeTypeListJson(declaration.extend) } : {}),
            });
        },
        DECLARATION_OPTIONS,
    );
};

export type InitializerBlockJson = {
    block: (StatementJson | ErrorJson)[];
    modifier: ModifiersJson;
    isStatic: boolean;
};

export type ClassDeclarationJson = StructureJson<'class', { name: ConvertKeys }> & {
    name: string | ErrorJson;
    block: (
        | InitializerBlockJson
        | (FieldDeclarationJson & { modifier: ModifiersJson })
        | (PropertyDeclarationJson & { modifier: ModifiersJson })
        | (EnumDeclarationJson & { modifier: ModifiersJson })
        | (MethodDeclarationJson & { modifier: ModifiersJson })
        | (InterfaceDeclarationJson & { modifier: ModifiersJson })
        | (ConstructorDeclarationJson & { modifier: ModifiersJson })
        | (ClassDeclarationJson & { modifier: ModifiersJson })
        | JsonType<'notSet'>
        | ErrorJson
    )[];
    extend?: TypeJson | ErrorJson;
    implement?: (TypeJson | ErrorJson)[] | ErrorJson;
};

export const isClassDeclarationJson = typia.createIs<ClassDeclarationJson>();

export const makeClassDeclarationJson = (
    target: ConvertType<ClassDeclarationType>,
): ClassDeclarationJson | ErrorJson => {
    return convertValue<
        'classDeclaration',
        ClassDeclarationType,
        ClassDeclarationJson,
        { name: ConvertKeys }
    >(
        target,
        'class',
        (declaration: ConvertWithError<ClassDeclarationType>, targetRecords) => {
            const block: (
                | InitializerBlockJson
                | (FieldDeclarationJson & { modifier: ModifiersJson })
                | (PropertyDeclarationJson & { modifier: ModifiersJson })
                | (EnumDeclarationJson & { modifier: ModifiersJson })
                | (MethodDeclarationJson & { modifier: ModifiersJson })
                | (InterfaceDeclarationJson & { modifier: ModifiersJson })
                | (ConstructorDeclarationJson & { modifier: ModifiersJson })
                | (ClassDeclarationJson & { modifier: ModifiersJson })
                | JsonType<'notSet'>
                | ErrorJson
            )[] = [];
            const body = declaration.body;
            if (isErrorNode(body)) {
                block.push(makeErrorJson(body, ERROR_KIND));
            } else {
                body.value.forEach((b) => {
                    if (isErrorNode(b)) {
                        block.push(makeErrorJson(b, ERROR_KIND));
                        return;
                    }

                    const member = b.value;
                    if (!member) {
                        block.push(
                            makeJsonType(
                                'notSet',
                                { objectKey: b.objectKey, sourceKey: b.sourceKey },
                                {},
                            ),
                        );
                        return;
                    }
                    if (isErrorNode(member)) {
                        block.push(makeErrorJson(member, ERROR_KIND));
                        return;
                    }

                    const modifier = makeModifiersJson(b.modifier);
                    if (member.type === 'block') {
                        block.push({
                            block: makeBlockJson(member),
                            modifier: modifier,
                            isStatic: b.isStatic,
                        });
                        return;
                    }

                    const declaration = makeMemberDeclarationJson(member);
                    if (declaration.kind === 'error') {
                        block.push(declaration);
                    } else {
                        block.push({ ...declaration, modifier: modifier });
                    }
                });
            }
            return makeStructureJson('class', targetRecords, {
                name: makeNameJson(declaration.value),
                block: block,
                ...(declaration.extend ? { extend: makeTypeJson(declaration.extend) } : {}),
                ...(declaration.implement
                    ? { implement: makeTypeListJson(declaration.implement) }
                    : {}),
            });
        },
        DECLARATION_OPTIONS,
    );
};

export type EnumConstantJson = JsonType<'enumConstant'> & {
    name: string;
};

const makeEnumConstantJson = (target: ConvertType<IdType>): EnumConstantJson | ErrorJson => {
    return convertValue<'id', IdType, EnumConstantJson>(
        target,
        'enumConstant',
        (target, targetRecords) => {
            return makeJsonType('enumConstant', targetRecords.base, { name: target.value });
        },
    );
};

export type EnumDeclarationJson = StructureJson<'enum', { name: ConvertKeys }> & {
    name: string | ErrorJson;
    members?: (EnumConstantJson | ErrorJson)[] | ErrorJson;
};

export const isEnumDeclarationJson = typia.createIs<EnumDeclarationJson>();

export const makeEnumDeclarationJson = (
    target: ConvertType<EnumDeclarationType>,
): EnumDeclarationJson | ErrorJson => {
    return convertValue<
        'enumDeclaration',
        EnumDeclarationType,
        EnumDeclarationJson,
        { name: ConvertKeys }
    >(
        target,
        'enum',
        (declaration: ConvertWithError<EnumDeclarationType>, targetRecords) => {
            const constant = declaration.constant;
            return makeStructureJson('enum', targetRecords, {
                name: makeNameJson(declaration.value),
                ...(constant
                    ? {
                          members: isErrorNode(constant)
                              ? makeErrorJson(constant, ERROR_KIND)
                              : constant.value.map((m) => makeEnumConstantJson(m)),
                      }
                    : {}),
            });
        },
        DECLARATION_OPTIONS,
    );
};

type AccessorContentJson = {
    block?: (StatementJson | ErrorJson)[];
    modifier: ModifiersJson;
};

export type PropertyDeclarationJson = StructureJson<'property', { name: ConvertKeys }> & {
    name: string | ErrorJson;
    variantType: TypeJson | ErrorJson;
    isGetter: boolean;
    getterContent?: AccessorContentJson;
    isSetter: boolean;
    setterContent?: AccessorContentJson;
    // 取り出せなかった getter / setter
    error?: ErrorJson[];
};

export const isPropertyDeclarationJson = typia.createIs<PropertyDeclarationJson>();

export const makePropertyDeclarationJson = (
    target: ConvertType<PropertyDeclarationType>,
): PropertyDeclarationJson | ErrorJson => {
    return convertValue<
        'propertyDeclaration',
        PropertyDeclarationType,
        PropertyDeclarationJson,
        { name: ConvertKeys }
    >(
        target,
        'property',
        (declaration: ConvertWithError<PropertyDeclarationType>, targetRecords) => {
            let getterContent: AccessorContentJson | undefined = undefined;
            let setterContent: AccessorContentJson | undefined = undefined;
            const errors: ErrorJson[] = [];

            declaration.block.forEach((b) => {
                if (isErrorNode(b)) {
                    errors.push(makeErrorJson(b, ERROR_KIND));
                    return;
                }

                const accessor = b.value;
                if (isErrorNode(accessor)) {
                    errors.push(makeErrorJson(accessor, ERROR_KIND));
                    return;
                }

                const content: AccessorContentJson = {
                    ...(accessor.block ? { block: makeBlockJson(accessor.block) } : {}),
                    modifier: makeModifiersJson(b.modifier),
                };
                if (accessor.type === 'getter') {
                    getterContent = content;
                } else {
                    setterContent = content;
                }
            });

            return makeStructureJson('property', targetRecords, {
                name: makeNameJson(declaration.value),
                variantType: makeTypeJson(declaration.valueType),
                isGetter: getterContent !== undefined,
                ...(getterContent ? { getterContent: getterContent } : {}),
                isSetter: setterContent !== undefined,
                ...(setterContent ? { setterContent: setterContent } : {}),
                ...(errors.length ? { error: errors } : {}),
            });
        },
        DECLARATION_OPTIONS,
    );
};

// field は初期値まで含めて部分木全体を検査する（ローカル変数の文と同じ扱い）
export type FieldDeclarationJson = JsonType<'field'> & {
    variants: (VariantJson | ErrorJson)[] | ErrorJson;
    variantType: TypeJson | ErrorJson;
};

export const isFieldDeclarationJson = typia.createIs<FieldDeclarationJson>();

export const makeFieldDeclarationJson = (
    target: ConvertType<FieldDeclarationType>,
): FieldDeclarationJson | ErrorJson => {
    return convertValue<'fieldDeclaration', FieldDeclarationType, FieldDeclarationJson>(
        target,
        'field',
        (declaration, targetRecords) => {
            return makeJsonType('field', targetRecords.base, {
                variants: makeVariantsJson(declaration.value),
                variantType: makeTypeJson(declaration.valueType),
            });
        },
    );
};

export type ConstructorDeclarationJson = StructureJson<'constructor', { name: ConvertKeys }> & {
    name: (string | ErrorJson)[] | ErrorJson;
    param?: (ParameterJson | ErrorJson)[] | ErrorJson;
    block: (StatementJson | ErrorJson)[];
};

export const isConstructorDeclarationJson = typia.createIs<ConstructorDeclarationJson>();

export const makeConstructorDeclarationJson = (
    target: ConvertType<ConstructorDeclarationType>,
): ConstructorDeclarationJson | ErrorJson => {
    return convertValue<
        'constructorDeclaration',
        ConstructorDeclarationType,
        ConstructorDeclarationJson,
        { name: ConvertKeys }
    >(
        target,
        'constructor',
        (declaration: ConvertWithError<ConstructorDeclarationType>, targetRecords) => {
            const name = declaration.value;
            const param = declaration.param ? makeParametersJson(declaration.param) : null;
            return makeStructureJson('constructor', targetRecords, {
                name: isErrorNode(name)
                    ? makeErrorJson(name, ERROR_KIND)
                    : name.value.map((v) => makeNameJson(v)),
                ...(param ? { param: param } : {}),
                block: makeBlockJson(declaration.block),
            });
        },
        DECLARATION_OPTIONS,
    );
};

export type LocalVariableDeclarationJson = {
    variants: (VariantJson | ErrorJson)[] | ErrorJson;
    variantsType: TypeJson | ErrorJson;
    modifier: ModifiersJson;
};

export const isLocalVariableDeclarationJson = typia.createIs<LocalVariableDeclarationJson>();

export const makeLocalVariableDeclarationJson = (
    target: ConvertWithError<LocalVariableDeclarationType>,
): LocalVariableDeclarationJson => {
    return {
        variants: makeVariantsJson(target.value),
        variantsType: makeTypeJson(target.valueType),
        modifier: makeModifiersJson(target.modifier),
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

export const makeMemberDeclarationJson = (
    target: ConvertWithError<
        MemberDeclarationType | AnonymousMemberDeclarationType | TriggerMemberDeclarationType
    >,
): MemberDeclarationJson | ErrorJson => {
    const declaration = target.value;
    if (isErrorNode(declaration)) {
        return makeErrorJson(declaration, ERROR_KIND);
    }

    if (declaration.type === 'methodDeclaration') {
        return makeMethodDeclarationJson(declaration);
    } else if (declaration.type === 'interfaceDeclaration') {
        return makeInterfaceDeclarationJson(declaration);
    } else if (declaration.type === 'classDeclaration') {
        return makeClassDeclarationJson(declaration);
    } else if (declaration.type === 'enumDeclaration') {
        return makeEnumDeclarationJson(declaration);
    } else if (declaration.type === 'propertyDeclaration') {
        return makePropertyDeclarationJson(declaration);
    } else if (declaration.type === 'fieldDeclaration') {
        return makeFieldDeclarationJson(declaration);
    } else {
        return makeConstructorDeclarationJson(declaration);
    }
};

