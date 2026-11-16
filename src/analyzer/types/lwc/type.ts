// TS・Flow の型注釈の JSON (docs/lwc-implementation.md)。Apex の types/apex/type.ts と同じ形:
// 境界ノード (LwcTypeJson) は最上位の型だけで、型引数・要素型はキーのない中身 (LwcTypeContentJson) で持つ。
// Flow の型は、TS の同じ意味の型と同じ形にする (docs/lwc-json-types.md 7 章の 8)。
// 入力は IR v2 (lwc_IR) のノード。v2 の木にはエラーのノードがないので、部分木の検査はしない
import type { JsonType } from '../commons/json';
import type { commons, flowVisitor, typeScriptVisitor } from '../lwc_IR';

import { isLwcNode, nameOf, type LwcJsonContext, type LwcNode } from './commons';

export type LwcTypeMemberContentJson = {
    name: string;
    memberType?: LwcTypeContentJson;
    optional: boolean;
    /** メソッドのシグネチャ (foo(): void)。getter / setter も含む */
    method: boolean;
    /** Flow の variance (+x は plus、-x は minus)。TS にはない */
    variance?: 'plus' | 'minus';
};

/** インデックス (TS の [key: string]: T・Flow の [key: string]: T / [string]: T) */
export type LwcTypeIndexerContentJson = {
    /** キーの名前 (Flow の [string]: T は持たない) */
    name?: string;
    keyType?: LwcTypeContentJson;
    valueType?: LwcTypeContentJson;
    /** Flow の variance (+[key: string]: T) */
    variance?: 'plus' | 'minus';
};

export type LwcTypeContentJson =
    /** string / number / unknown など (Apex の primitive)。Flow の mixed・empty・存在型 (*) も */
    | { type: 'primitive'; primitiveType: string }
    /**
     * Row / Promise<Row[]> / a.B (Apex の custom。generic は型引数)。Flow の $Keys<T> なども。
     * customType は名前の並び (a.B は ['a', 'B']。Apex の customType と同じ。lwc-json-types.md 8.8 の残りを直した)
     */
    | { type: 'custom'; customType: string[]; generic?: LwcTypeContentJson[] }
    | { type: 'array'; elementType: LwcTypeContentJson }
    /** Flow の ?T は T | null | void の union */
    | { type: 'union' | 'intersection'; types: LwcTypeContentJson[] }
    | { type: 'literal'; value: string }
    | {
          type: 'object';
          members: LwcTypeMemberContentJson[];
          indexers?: LwcTypeIndexerContentJson[];
          /** Flow の { ...A, b: T } の ...A (メンバーとの順番は持たない) */
          spreads?: LwcTypeContentJson[];
          /** Flow の {| |} は exact、{ ... } は inexact。どちらでもないときは持たない */
          exactness?: 'exact' | 'inexact';
      }
    | {
          type: 'function';
          /** 名前は Flow の名前のない引数 ((string) => void) では持たない。残りの引数は ...args */
          params: { name?: string; paramType?: LwcTypeContentJson }[];
          returnType?: LwcTypeContentJson;
          /** new (...) => T (TS のコンストラクタの型)。abstract new は abstract も持つ */
          construct?: true;
          abstract?: true;
      }
    | { type: 'tuple'; elementTypes: LwcTypeContentJson[] }
    /** typeof x / typeof a.b (target は名前の並び) */
    | { type: 'typeof'; target: string[] }
    /** A extends B ? C : D */
    | {
          type: 'conditional';
          checkType: LwcTypeContentJson;
          extendsType: LwcTypeContentJson;
          trueType: LwcTypeContentJson;
          falseType: LwcTypeContentJson;
      }
    /** { [K in T as N]?: V } (readonly・optional は '+' (書いただけのときも) か '-') */
    | {
          type: 'mapped';
          key: string;
          constraint: LwcTypeContentJson;
          nameType?: LwcTypeContentJson;
          valueType?: LwcTypeContentJson;
          readonly?: '+' | '-';
          optional?: '+' | '-';
      }
    /** T[K] (Flow の T?.[K] は optional) */
    | {
          type: 'indexedAccess';
          objectType: LwcTypeContentJson;
          indexType: LwcTypeContentJson;
          optional?: true;
      }
    /** keyof T / readonly T[] / unique symbol */
    | { type: 'operator'; operator: string; argument: LwcTypeContentJson }
    /** `a${T}b` (quasis は書いた文字列。types より 1 つ多い) */
    | { type: 'templateLiteral'; quasis: string[]; types: LwcTypeContentJson[] }
    /** import('x').A<T> */
    | {
          type: 'import';
          source: string;
          qualifier?: string[];
          generic?: LwcTypeContentJson[];
      }
    /** infer U extends C */
    | { type: 'infer'; name: string; constraint?: LwcTypeContentJson }
    /** x is T / asserts x / asserts x is T (parameterName の this は 'this') */
    | {
          type: 'predicate';
          parameterName: string;
          asserts: boolean;
          predicateType?: LwcTypeContentJson;
      }
    /** 上のどれでもない型 (nodeType は IR のノードの種類)。Apex の unsupported に当たる */
    | { type: 'unknown'; nodeType: string };

/**
 * 型の境界ノード。書かれた型の文字列 (text) は持たない (段階 6 の残り。lwc-json-types.md 8.8)。
 * 表示には lwcTypeTextOf で中身から作る
 */
export type LwcTypeJson = JsonType<'lwcType'> & LwcTypeContentJson;

const PRIMITIVES: Record<string, string> = {
    tSAnyKeyword: 'any',
    tSBooleanKeyword: 'boolean',
    tSBigIntKeyword: 'bigint',
    tSIntrinsicKeyword: 'intrinsic',
    tSNeverKeyword: 'never',
    tSNullKeyword: 'null',
    tSNumberKeyword: 'number',
    tSObjectKeyword: 'object',
    tSStringKeyword: 'string',
    tSSymbolKeyword: 'symbol',
    tSUndefinedKeyword: 'undefined',
    tSUnknownKeyword: 'unknown',
    tSVoidKeyword: 'void',
    tSThisType: 'this',
    // Flow のキーワードの型 (名前は書いたとおり。mixed は TS の unknown、empty は never に当たる)
    anyTypeAnnotation: 'any',
    booleanTypeAnnotation: 'boolean',
    nullLiteralTypeAnnotation: 'null',
    numberTypeAnnotation: 'number',
    stringTypeAnnotation: 'string',
    symbolTypeAnnotation: 'symbol',
    voidTypeAnnotation: 'void',
    thisTypeAnnotation: 'this',
    mixedTypeAnnotation: 'mixed',
    emptyTypeAnnotation: 'empty',
    // 存在型 (*)
    existsTypeAnnotation: '*',
};

/** Flow のリテラルの型。値は TS の tSLiteralType と同じく書いた文字列 ('a' / -1 / true / 1n) */
const FLOW_LITERALS = new Set([
    'stringLiteralTypeAnnotation',
    'numberLiteralTypeAnnotation',
    'booleanLiteralTypeAnnotation',
    'bigIntLiteralTypeAnnotation',
]);

/** 型注釈 (: T。TS の TSTypeAnnotation・Flow の TypeAnnotation) なら中の型 */
const unwrapAnnotation = (node: LwcNode): LwcNode => {
    switch (node.kind) {
        case 'tSTypeAnnotation':
            return (node as typeScriptVisitor.TSTypeAnnotationTypeClass).getFields().typeAnnotation;
        case 'typeAnnotation':
            return (node as flowVisitor.TypeAnnotationTypeClass).getFields().typeAnnotation;
        default:
            return node;
    }
};

const varianceOf = (
    variance: flowVisitor.VarianceTypeClass | null,
): { variance?: 'plus' | 'minus' } => (variance ? { variance: variance.getFields().kind } : {});

/** Flow のオブジェクトの型のプロパティ (a: T / +a: T / foo(): T / get a(): T) */
const makeFlowPropertyContentJson = (
    property: commons.ObjectTypePropertyTypeClass,
    context: LwcJsonContext,
): LwcTypeMemberContentJson => {
    const fields = property.getFields();
    const value: LwcNode = fields.value;
    // メソッド・getter・setter の値は関数の型。TS のシグネチャと同じく、memberType は戻り値の型 (setter は持たない)
    const memberType: LwcNode | null = !fields.method
        ? value
        : fields.kind === 'set'
          ? null
          : value.kind === 'functionTypeAnnotation'
            ? (value as commons.FunctionTypeAnnotationTypeClass).getFields().returnType
            : value;
    return {
        name: nameOf(fields.key, context),
        ...(memberType ? { memberType: makeLwcTypeContentJson(memberType, context) } : {}),
        optional: fields.optional,
        method: fields.method,
        ...varianceOf(fields.variance),
    };
};

/**
 * interface・型リテラル・Flow のオブジェクトの型のメンバー (プロパティ・メソッドのシグネチャ)。
 * それ以外 (インデックス・Flow のスプレッドなど) は null
 */
export const makeLwcTypeMemberContentJson = (
    member: LwcNode,
    context: LwcJsonContext,
): LwcTypeMemberContentJson | null => {
    let annotation: LwcNode | null;
    let fields: commons.TSPropertySignatureFields | commons.TSMethodSignatureFields;
    switch (member.kind) {
        case 'tSPropertySignature':
            fields = (member as commons.TSPropertySignatureTypeClass).getFields();
            annotation = fields.typeAnnotation;
            break;
        case 'tSMethodSignature':
            fields = (member as commons.TSMethodSignatureTypeClass).getFields();
            // set のシグネチャは戻り値の型を持たない
            annotation = 'returnType' in fields ? fields.returnType : null;
            break;
        case 'objectTypeProperty':
            return makeFlowPropertyContentJson(
                member as commons.ObjectTypePropertyTypeClass,
                context,
            );
        default:
            return null;
    }
    return {
        name: nameOf(fields.key, context),
        ...(annotation ? { memberType: makeLwcTypeContentJson(annotation, context) } : {}),
        optional: fields.optional,
        method: member.kind === 'tSMethodSignature',
    };
};

/** インデックス (TS の tSIndexSignature・Flow の objectTypeIndexer)。それ以外は null */
const makeIndexerContentJson = (
    member: LwcNode,
    context: LwcJsonContext,
): LwcTypeIndexerContentJson | null => {
    switch (member.kind) {
        case 'tSIndexSignature': {
            const { parameter, typeAnnotation } = (
                member as commons.TSIndexSignatureTypeClass
            ).getFields();
            const keyAnnotation = parameter.getFields().typeAnnotation;
            return {
                name: parameter.getFields().name,
                ...(keyAnnotation
                    ? { keyType: makeLwcTypeContentJson(keyAnnotation, context) }
                    : {}),
                ...(typeAnnotation
                    ? { valueType: makeLwcTypeContentJson(typeAnnotation, context) }
                    : {}),
            };
        }
        case 'objectTypeIndexer': {
            const { id, key, value, variance } = (
                member as commons.ObjectTypeIndexerTypeClass
            ).getFields();
            return {
                ...(id ? { name: id.getFields().name } : {}),
                keyType: makeLwcTypeContentJson(key, context),
                valueType: makeLwcTypeContentJson(value, context),
                ...varianceOf(variance),
            };
        }
        default:
            return null;
    }
};

/** Flow のオブジェクトの型 ({ a: T } / {| a: T |} / { ...A, [k: K]: V }) */
const makeFlowObjectContentJson = (
    node: commons.ObjectTypeAnnotationTypeClass,
    context: LwcJsonContext,
): LwcTypeContentJson => {
    // 呼び出し ({ (x: T): U }) と内部スロット ([[foo]]: T) は、TS の呼び出しのシグネチャと同じく持たない
    const { properties, indexers, exactness } = node.getFields();
    const members: LwcTypeMemberContentJson[] = [];
    const spreads: LwcTypeContentJson[] = [];
    for (const property of properties) {
        if (property.kind === 'objectTypeProperty') {
            members.push(makeFlowPropertyContentJson(property, context));
        } else {
            spreads.push(makeLwcTypeContentJson(property.getFields().argument, context));
        }
    }
    const indexerJson = indexers.flatMap((i) => makeIndexerContentJson(i, context) ?? []);
    return {
        type: 'object',
        members,
        ...(indexerJson.length > 0 ? { indexers: indexerJson } : {}),
        ...(spreads.length > 0 ? { spreads } : {}),
        ...(exactness !== 'default' ? { exactness } : {}),
    };
};

/** 関数の型の引数 (x: T / ...rest: T[] / { a }: T) */
const makeFunctionParamContentJson = (
    param: commons.TSFunctionTypeFields['params'][number],
    context: LwcJsonContext,
): { name?: string; paramType?: LwcTypeContentJson } => {
    const annotation = param.getFields().typeAnnotation;
    let name: string;
    if (param.kind === 'identifier') {
        name = param.getFields().name;
    } else if (
        param.kind === 'restElement' &&
        (param.getFields().argument as LwcNode).kind === 'identifier'
    ) {
        // 残りの引数は Flow と同じく ...名前 (型注釈の文字列を含めない)
        name = `...${(param.getFields().argument as commons.IdentifierTypeClass).getFields().name}`;
    } else {
        name = context.textOf(param);
    }
    return {
        name,
        ...(annotation ? { paramType: makeLwcTypeContentJson(annotation, context) } : {}),
    };
};

/** Flow の関数の型の引数 (x: T / T / ...rest: T)。this の引数は名前を this にする (TS の this: T と同じ) */
const makeFlowFunctionParamContentJson = (
    param: flowVisitor.FunctionTypeParamTypeClass,
    as: 'param' | 'rest' | 'this',
    context: LwcJsonContext,
): { name?: string; paramType: LwcTypeContentJson } => {
    const { name, typeAnnotation } = param.getFields();
    const paramName =
        as === 'this'
            ? 'this'
            : as === 'rest'
              ? `...${name ? name.getFields().name : ''}`
              : name?.getFields().name;
    return {
        ...(paramName !== undefined ? { name: paramName } : {}),
        paramType: makeLwcTypeContentJson(typeAnnotation, context),
    };
};

/** 名前 (a.B・Identifier・TSQualifiedName・QualifiedTypeIdentifier) を名前の並びにする */
const namePartsOf = (node: LwcNode, context: LwcJsonContext): string[] =>
    context
        .textOf(node)
        .split('.')
        .map((part) => part.trim());

/** 型引数のある名前の型 (TS の型参照・implements、Flow の generic・implements) */
const makeCustomContentJson = (
    customType: string[],
    typeArguments: readonly LwcNode[] | undefined,
    context: LwcJsonContext,
): LwcTypeContentJson => {
    const generic = (typeArguments ?? []).map((a) => makeLwcTypeContentJson(a, context));
    return { type: 'custom', customType, ...(generic.length > 0 ? { generic } : {}) };
};

/** typeof の対象 (名前の並び)。名前でなければ (typeof import('x') など) null */
const typeofTargetOf = (target: LwcNode, context: LwcJsonContext): string[] | null => {
    switch (target.kind) {
        case 'identifier':
            return [(target as commons.IdentifierTypeClass).getFields().name];
        case 'tSQualifiedName':
        case 'qualifiedTypeIdentifier':
            return namePartsOf(target, context);
        case 'genericTypeAnnotation':
            return typeofTargetOf(
                (target as commons.GenericTypeAnnotationTypeClass).getFields().id,
                context,
            );
        default:
            return null;
    }
};

/** 型のノード → 型の中身 (キーなし) */
export const makeLwcTypeContentJson = (
    target: LwcNode,
    context: LwcJsonContext,
): LwcTypeContentJson => {
    const node = unwrapAnnotation(target);
    const primitive = PRIMITIVES[node.kind];
    if (primitive) {
        return { type: 'primitive', primitiveType: primitive };
    }
    if (FLOW_LITERALS.has(node.kind)) {
        return { type: 'literal', value: context.textOf(node) };
    }
    const content = (child: LwcNode) => makeLwcTypeContentJson(child, context);

    switch (node.kind) {
        case 'tSParenthesizedType':
        case 'tSOptionalType':
        case 'tSRestType':
            // tSRestType の中は tSNamedTupleMember (...rest: T[]) のこともある (v1 と同じく other になる)
            return content(
                (
                    node as
                        | commons.TSParenthesizedTypeTypeClass
                        | commons.TSOptionalTypeTypeClass
                        | commons.TSRestTypeTypeClass
                ).getFields().typeAnnotation,
            );
        case 'tSTypeReference': {
            const { typeName, typeArguments } = (
                node as commons.TSTypeReferenceTypeClass
            ).getFields();
            return makeCustomContentJson(
                namePartsOf(typeName, context),
                typeArguments?.getFields().params,
                context,
            );
        }
        case 'genericTypeAnnotation': {
            // Flow の名前の型 (Row / Array<T> / $Keys<T> / a.B)
            const { id, typeParameters } = (
                node as commons.GenericTypeAnnotationTypeClass
            ).getFields();
            return makeCustomContentJson(
                namePartsOf(id, context),
                typeParameters?.getFields().params,
                context,
            );
        }
        case 'tSClassImplements': {
            const { expression, typeArguments } = (
                node as commons.TSClassImplementsTypeClass
            ).getFields();
            return makeCustomContentJson(
                namePartsOf(expression, context),
                typeArguments?.getFields().params,
                context,
            );
        }
        case 'classImplements': {
            const { id, typeParameters } = (
                node as flowVisitor.ClassImplementsTypeClass
            ).getFields();
            return makeCustomContentJson(
                [id.getFields().name],
                typeParameters?.getFields().params,
                context,
            );
        }
        case 'identifier':
            // Flow の型注釈の中が名前だけのとき
            return {
                type: 'custom',
                customType: [(node as commons.IdentifierTypeClass).getFields().name],
            };
        case 'tSArrayType':
        case 'arrayTypeAnnotation':
            return {
                type: 'array',
                elementType: content(
                    (
                        node as commons.TSArrayTypeTypeClass | commons.ArrayTypeAnnotationTypeClass
                    ).getFields().elementType,
                ),
            };
        case 'nullableTypeAnnotation':
            // ?T は T | null | void
            return {
                type: 'union',
                types: [
                    content(
                        (node as commons.NullableTypeAnnotationTypeClass).getFields()
                            .typeAnnotation,
                    ),
                    { type: 'primitive', primitiveType: 'null' },
                    { type: 'primitive', primitiveType: 'void' },
                ],
            };
        case 'tSUnionType':
        case 'tSIntersectionType':
        case 'unionTypeAnnotation':
        case 'intersectionTypeAnnotation':
            return {
                type:
                    node.kind === 'tSUnionType' || node.kind === 'unionTypeAnnotation'
                        ? 'union'
                        : 'intersection',
                types: (
                    node as
                        | commons.TSUnionTypeTypeClass
                        | commons.TSIntersectionTypeTypeClass
                        | commons.UnionTypeAnnotationTypeClass
                        | commons.IntersectionTypeAnnotationTypeClass
                )
                    .getFields()
                    .types.map(content),
            };
        case 'tSLiteralType': {
            const literal = (node as commons.TSLiteralTypeTypeClass).getFields().literal;
            // 負の数 (-1) はノードでないので、型全体の文字列 (同じ位置) にする
            return {
                type: 'literal',
                value: isLwcNode(literal) ? context.textOf(literal) : context.textOf(node),
            };
        }
        case 'tSTypeLiteral': {
            const members: LwcNode[] = (node as commons.TSTypeLiteralTypeClass).getFields().members;
            const indexers = members.flatMap((m) => makeIndexerContentJson(m, context) ?? []);
            return {
                type: 'object',
                members: members.flatMap((m) => makeLwcTypeMemberContentJson(m, context) ?? []),
                ...(indexers.length > 0 ? { indexers } : {}),
            };
        }
        case 'objectTypeAnnotation':
            return makeFlowObjectContentJson(
                node as commons.ObjectTypeAnnotationTypeClass,
                context,
            );
        case 'interfaceTypeAnnotation':
            // interface { a: T } (式の位置の interface)。extends は持たない
            return makeFlowObjectContentJson(
                (node as commons.InterfaceTypeAnnotationTypeClass).getFields().body,
                context,
            );
        case 'tSFunctionType': {
            const { params, returnType } = (node as commons.TSFunctionTypeTypeClass).getFields();
            return {
                type: 'function',
                params: params.map((param) => makeFunctionParamContentJson(param, context)),
                ...(returnType ? { returnType: content(returnType) } : {}),
            };
        }
        case 'functionTypeAnnotation': {
            // 型引数 (<T>(x: T) => T の <T>) は TS と同じく持たない
            const fields = (node as commons.FunctionTypeAnnotationTypeClass).getFields();
            return {
                type: 'function',
                params: [
                    ...(fields.this
                        ? [makeFlowFunctionParamContentJson(fields.this, 'this', context)]
                        : []),
                    ...fields.params.map((param) =>
                        makeFlowFunctionParamContentJson(param, 'param', context),
                    ),
                    ...(fields.rest
                        ? [makeFlowFunctionParamContentJson(fields.rest, 'rest', context)]
                        : []),
                ],
                returnType: content(fields.returnType),
            };
        }
        case 'tSTupleType':
            return {
                type: 'tuple',
                elementTypes: (node as commons.TSTupleTypeTypeClass)
                    .getFields()
                    .elements.map((element: LwcNode) =>
                        element.kind === 'tSNamedTupleMember'
                            ? content(
                                  (element as commons.TSNamedTupleMemberTypeClass).getFields()
                                      .elementType,
                              )
                            : content(element),
                    ),
            };
        case 'tupleTypeAnnotation':
            return {
                type: 'tuple',
                elementTypes: (node as commons.TupleTypeAnnotationTypeClass)
                    .getFields()
                    .types.map(content),
            };
        case 'tSTypeQuery':
        case 'typeofTypeAnnotation': {
            const typeofTarget = typeofTargetOf(
                node.kind === 'tSTypeQuery'
                    ? (node as commons.TSTypeQueryTypeClass).getFields().exprName
                    : (node as commons.TypeofTypeAnnotationTypeClass).getFields().argument,
                context,
            );
            return typeofTarget === null
                ? { type: 'unknown', nodeType: node.kind }
                : { type: 'typeof', target: typeofTarget };
        }
        case 'tSInterfaceHeritage': {
            // interface A extends B<T> の B<T>
            const { expression, typeArguments } = (
                node as commons.TSInterfaceHeritageTypeClass
            ).getFields();
            return makeCustomContentJson(
                namePartsOf(expression, context),
                typeArguments?.getFields().params,
                context,
            );
        }
        case 'interfaceExtends': {
            const { id, typeParameters } = (
                node as flowVisitor.InterfaceExtendsTypeClass
            ).getFields();
            return makeCustomContentJson(
                namePartsOf(id, context),
                typeParameters?.getFields().params,
                context,
            );
        }
        case 'tSConditionalType': {
            const fields = (node as commons.TSConditionalTypeTypeClass).getFields();
            return {
                type: 'conditional',
                checkType: content(fields.checkType),
                extendsType: content(fields.extendsType),
                trueType: content(fields.trueType),
                falseType: content(fields.falseType),
            };
        }
        case 'tSMappedType': {
            const fields = (node as commons.TSMappedTypeTypeClass).getFields();
            return {
                type: 'mapped',
                key: fields.key.getFields().name,
                constraint: content(fields.constraint),
                ...(fields.nameType ? { nameType: content(fields.nameType) } : {}),
                ...(fields.typeAnnotation ? { valueType: content(fields.typeAnnotation) } : {}),
                ...(fields.readonly ? { readonly: fields.readonly } : {}),
                ...(fields.optional ? { optional: fields.optional } : {}),
            };
        }
        case 'tSIndexedAccessType':
        case 'indexedAccessType':
        case 'optionalIndexedAccessType': {
            const fields = (
                node as
                    | commons.TSIndexedAccessTypeTypeClass
                    | commons.IndexedAccessTypeTypeClass
                    | commons.OptionalIndexedAccessTypeTypeClass
            ).getFields();
            return {
                type: 'indexedAccess',
                objectType: content(fields.objectType),
                indexType: content(fields.indexType),
                ...('optional' in fields && fields.optional ? { optional: true as const } : {}),
            };
        }
        case 'tSTypeOperator': {
            const fields = (node as commons.TSTypeOperatorTypeClass).getFields();
            return {
                type: 'operator',
                operator: fields.operator,
                argument: content(fields.typeAnnotation),
            };
        }
        case 'tSTemplateLiteralType': {
            const { head, spans } = (node as commons.TSTemplateLiteralTypeTypeClass).getFields();
            return {
                type: 'templateLiteral',
                quasis: [head, ...spans.map((span) => span.tail)].map(
                    (element) => element.getFields().value.raw,
                ),
                types: spans.map((span) => content(span.type)),
            };
        }
        case 'tSImportType': {
            const { source, qualifier, typeArguments } = (
                node as commons.TSImportTypeTypeClass
            ).getFields();
            const generic = (typeArguments?.getFields().params ?? []).map(content);
            return {
                type: 'import',
                source: source.getFields().value,
                ...(qualifier ? { qualifier: namePartsOf(qualifier, context) } : {}),
                ...(generic.length > 0 ? { generic } : {}),
            };
        }
        case 'tSInferType': {
            const parameter = (node as commons.TSInferTypeTypeClass).getFields().typeParameter;
            const { name, constraint } = parameter.getFields();
            return {
                type: 'infer',
                name: name.getFields().name,
                ...(constraint ? { constraint: content(constraint) } : {}),
            };
        }
        case 'tSTypePredicate': {
            const fields = (node as commons.TSTypePredicateTypeClass).getFields();
            const parameter = fields.parameterName;
            return {
                type: 'predicate',
                parameterName:
                    parameter.kind === 'identifier'
                        ? (parameter as commons.IdentifierTypeClass).getFields().name
                        : 'this',
                asserts: fields.asserts,
                ...(fields.typeAnnotation ? { predicateType: content(fields.typeAnnotation) } : {}),
            };
        }
        case 'tSConstructorType': {
            const { params, returnType, abstract } = (
                node as commons.TSConstructorTypeTypeClass
            ).getFields();
            return {
                type: 'function',
                params: params.map((param) => makeFunctionParamContentJson(param, context)),
                ...(returnType ? { returnType: content(returnType) } : {}),
                construct: true,
                ...(abstract ? { abstract: true as const } : {}),
            };
        }
        default:
            return { type: 'unknown', nodeType: node.kind };
    }
};

/** 型の中身を TS の書き方の文字列にする (表示用。書いたとおりではない) */
export const lwcTypeTextOf = (type: LwcTypeContentJson): string => {
    const text = lwcTypeTextOf;
    const list = (types: LwcTypeContentJson[]) => types.map(text).join(', ');
    switch (type.type) {
        case 'primitive':
            return type.primitiveType;
        case 'custom':
            return `${type.customType.join('.')}${type.generic ? `<${list(type.generic)}>` : ''}`;
        case 'array':
            return `${text(type.elementType)}[]`;
        case 'union':
        case 'intersection':
            return type.types.map(text).join(type.type === 'union' ? ' | ' : ' & ');
        case 'literal':
            return type.value;
        case 'object':
            return `{ ${type.members
                .map(
                    (m) =>
                        `${m.name}${m.optional ? '?' : ''}: ${m.memberType ? text(m.memberType) : 'any'}`,
                )
                .join('; ')} }`;
        case 'function':
            return `${type.construct ? 'new ' : ''}(${type.params
                .map(
                    (p) =>
                        `${p.name ?? ''}${p.paramType ? `${p.name ? ': ' : ''}${text(p.paramType)}` : ''}`,
                )
                .join(', ')}) => ${type.returnType ? text(type.returnType) : 'void'}`;
        case 'tuple':
            return `[${list(type.elementTypes)}]`;
        case 'typeof':
            return `typeof ${type.target.join('.')}`;
        case 'conditional':
            return `${text(type.checkType)} extends ${text(type.extendsType)} ? ${text(type.trueType)} : ${text(type.falseType)}`;
        case 'mapped':
            return `{ [${type.key} in ${text(type.constraint)}]: ${type.valueType ? text(type.valueType) : 'any'} }`;
        case 'indexedAccess':
            return `${text(type.objectType)}[${text(type.indexType)}]`;
        case 'operator':
            return `${type.operator} ${text(type.argument)}`;
        case 'templateLiteral':
            return `\`${type.quasis
                .map((q, i) => (i < type.types.length ? `${q}\${${text(type.types[i]!)}}` : q))
                .join('')}\``;
        case 'import':
            return `import('${type.source}')${type.qualifier ? `.${type.qualifier.join('.')}` : ''}`;
        case 'infer':
            return `infer ${type.name}`;
        case 'predicate':
            return `${type.asserts ? 'asserts ' : ''}${type.parameterName}${type.predicateType ? ` is ${text(type.predicateType)}` : ''}`;
        case 'unknown':
            return type.nodeType;
    }
};

/**
 * 型注釈 (TSTypeAnnotation・Flow の TypeAnnotation) または型のノード → lwcType (境界ノード)。
 * キー・文字列は、型注釈を外した中の型のもの
 */
export const makeLwcTypeJson = (target: LwcNode, context: LwcJsonContext): LwcTypeJson => {
    const node = unwrapAnnotation(target);
    // 中身は union なので、makeJsonType の properties の型に合わせず直接組み立てる
    return {
        kind: 'lwcType',
        sourceKeys: context.keysOf(node),
        ...makeLwcTypeContentJson(node, context),
    };
};
