// TS の型の宣言 (interface / type / enum) の JSON (docs/lwc-implementation.md)。
// 名前を持つ宣言なので、Apex の宣言と同じく StructureJsonType (sourceKeys: { base, name })。
// 入力は IR v2 (lwc_IR) のノード。v2 の木にはエラーのノードがないので、部分木の検査はしない
import { makeStructureJson, type ConvertKeys, type StructureJsonType } from '../commons/json';
import type { commons } from '../lwc_IR';

import { nameOf, type LwcJsonContext } from './commons';
import {
    makeLwcTypeJson,
    makeLwcTypeMemberContentJson,
    type LwcTypeContentJson,
    type LwcTypeJson,
} from './type';

export type LwcTypeMemberJson = {
    name: string;
    memberType?: LwcTypeContentJson;
    optional: boolean;
    /** メソッドのシグネチャ (foo(): void) */
    method: boolean;
};

export type LwcTypeDeclarationJson = StructureJsonType<
    'lwcTypeDeclaration',
    { name: ConvertKeys }
> & {
    name: string;
    declarationType: 'interface' | 'type' | 'enum';
    exported: boolean;
    /** interface の extends (Apex の extend に当たる) */
    extend?: string[];
    /** interface のメンバー */
    members?: LwcTypeMemberJson[];
    /** type の右辺 */
    variantType?: LwcTypeJson;
    /** enum のメンバーの名前 */
    enumMembers?: string[];
};

export type LwcTypeDeclarationType =
    | commons.TSInterfaceDeclarationTypeClass
    | commons.TSTypeAliasDeclarationTypeClass
    | commons.TSEnumDeclarationTypeClass;

export const TYPE_DECLARATION_NODES: readonly string[] = [
    'tSInterfaceDeclaration',
    'tSTypeAliasDeclaration',
    'tSEnumDeclaration',
];

/** interface / type / enum の宣言 → lwcTypeDeclaration */
export const makeLwcTypeDeclarationJson = (
    node: LwcTypeDeclarationType,
    exported: boolean,
    context: LwcJsonContext,
): LwcTypeDeclarationJson => {
    const id = node.getFields().id;
    const sourceKeys = context.structureKeysOf(node, { name: id });
    const base = { name: id.getFields().name, exported };
    switch (node.kind) {
        case 'tSInterfaceDeclaration': {
            const fields = (node as commons.TSInterfaceDeclarationTypeClass).getFields();
            const extend = (fields.extends ?? []).map((e) => context.textOf(e));
            return makeStructureJson('lwcTypeDeclaration', sourceKeys, {
                ...base,
                declarationType: 'interface' as const,
                ...(extend.length > 0 ? { extend } : {}),
                members: fields.body
                    .getFields()
                    .body.flatMap((m) => makeLwcTypeMemberContentJson(m, context) ?? []),
            });
        }
        case 'tSEnumDeclaration':
            return makeStructureJson('lwcTypeDeclaration', sourceKeys, {
                ...base,
                declarationType: 'enum' as const,
                enumMembers: (node as commons.TSEnumDeclarationTypeClass)
                    .getFields()
                    .body.getFields()
                    .members.map((m) => nameOf(m.getFields().id, context)),
            });
        default:
            return makeStructureJson('lwcTypeDeclaration', sourceKeys, {
                ...base,
                declarationType: 'type' as const,
                variantType: makeLwcTypeJson(
                    (node as commons.TSTypeAliasDeclarationTypeClass).getFields().typeAnnotation,
                    context,
                ),
            });
    }
};
