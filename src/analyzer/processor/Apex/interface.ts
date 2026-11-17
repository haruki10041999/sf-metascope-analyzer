import type { ApexUnitJson } from '../../parser/Apex/unit';
import type {
    ClassDeclarationJson,
    ConvertKeys,
    EnumDeclarationJson,
    InterfaceDeclarationJson,
    ModifiersJson,
    ParameterJson,
    TypeContentJson,
    TypeJson,
} from '../../types';

// Apex の公開の形 (外から使えるクラス・メンバー)。意味の差分 (docs/json-redesign-plan.md の #11 の続き) の材料。
// 2 つの時点のこの結果を比べると「公開メソッドが増えた・引数が変わった」が分かる (report/code.ts の apex.interface)

/** 外から使えるクラス・メンバー 1 つ */
export type ApexInterfaceMember = {
    /** 持ち主の型 (Outer、内側のクラスは Outer.Inner) */
    owner: string;
    memberType: 'class' | 'interface' | 'enum' | 'method' | 'constructor' | 'property' | 'field';
    name: string;
    /** 引数の型 (メソッド・コンストラクタ。書いた順) */
    params?: string[];
    /** メソッドの戻り値の型・プロパティと項目の型・enum の値 (, でつなぐ)・クラスの継承 */
    type?: string;
    /** global / public。どちらも書かずにアノテーション (@AuraEnabled など) で外から使えるものは annotated */
    access: 'global' | 'public' | 'annotated';
    static: boolean;
    /** アノテーションの名前 (書いた順。isTest などの名前の大文字・小文字は書いたまま) */
    annotations: string[];
    sourceKeys?: ConvertKeys;
};

/** アクセス修飾子がなくても外から使えるアノテーション (Lightning・Flow・Visualforce・REST) */
const EXPOSING_ANNOTATIONS = new Set([
    'auraenabled',
    'invocablemethod',
    'invocablevariable',
    'remoteaction',
    'restresource',
    'httpget',
    'httppost',
    'httpput',
    'httppatch',
    'httpdelete',
]);

const contentTextOf = (type: TypeContentJson): string => {
    switch (type.type) {
        case 'primitive':
            return type.primitiveType;
        case 'custom':
            return `${type.customType.join('.')}${type.generic ? `<${type.generic.map(contentTextOf).join(', ')}>` : ''}`;
        case 'array':
            return `${contentTextOf(type.elementType)}${'[]'.repeat(type.dimension)}`;
        case 'list':
            return `List<${contentTextOf(type.elementType)}>`;
        case 'set':
            return `Set<${contentTextOf(type.elementType)}>`;
        case 'map':
            return `Map<${contentTextOf(type.keyType)}, ${contentTextOf(type.valueType)}>`;
    }
};

/** 型の表示 (List<Account>・Map<Id, String> など。void はそのまま) */
export const apexTypeTextOf = (type: TypeJson | TypeContentJson | 'void'): string =>
    type === 'void' ? 'void' : contentTextOf(type);

const accessOf = (modifiers: ModifiersJson | undefined): ApexInterfaceMember['access'] | null => {
    const keywords = (modifiers?.keyword ?? []).map((k) => k.name.toLowerCase());
    if (keywords.includes('global')) return 'global';
    if (keywords.includes('public')) return 'public';
    const exposed = (modifiers?.annotation ?? []).some((a) =>
        EXPOSING_ANNOTATIONS.has(a.name.toLowerCase()),
    );
    return exposed ? 'annotated' : null;
};

/** すべてのメンバーを出すときのアクセス (書いていなければ private) */
type OutlineAccess = ApexOutlineMember['access'];
const outlineAccessOf = (modifiers: ModifiersJson | undefined): OutlineAccess => {
    const access = accessOf(modifiers);
    if (access === 'global' || access === 'public') return access;
    const keywords = (modifiers?.keyword ?? []).map((k) => k.name.toLowerCase());
    if (keywords.includes('protected')) return 'protected';
    if (access === 'annotated') return 'annotated';
    return 'private';
};

const isTest = (modifiers: ModifiersJson | undefined) =>
    (modifiers?.annotation ?? []).some((a) => a.name.toLowerCase() === 'istest');

const paramsOf = (params: ParameterJson[]) => params.map((p) => apexTypeTextOf(p.variantType));

type TypeDeclaration = (ClassDeclarationJson | InterfaceDeclarationJson | EnumDeclarationJson) & {
    modifier: ModifiersJson;
};

/**
 * 型の中のクラス・メンバー。all なら、アクセスに関係なくすべて (テストのクラスも。クラスの概要 apex.outline)、
 * そうでなければ外から使えるものだけ (公開の形 apex.interface)
 */
const membersOfType = (
    declaration: TypeDeclaration,
    owner: string,
    parentAccess: OutlineAccess | null,
    all = false,
): ApexOutlineMember[] => {
    // 型そのもの。外側の型より広くは見えない (内側の型は外側が見えるときだけ)
    const ownAccess = all ? outlineAccessOf(declaration.modifier) : accessOf(declaration.modifier);
    if (!all && (ownAccess === null || parentAccess === null || isTest(declaration.modifier))) {
        return [];
    }
    const member = (
        properties: Omit<ApexOutlineMember, 'owner' | 'static' | 'annotations' | 'access'> & {
            modifier?: ModifiersJson;
            access?: OutlineAccess | null;
        },
    ): ApexOutlineMember => {
        const { modifier, access, ...rest } = properties;
        return {
            owner,
            access: access ?? (all ? outlineAccessOf(modifier) : (accessOf(modifier) ?? 'public')),
            static: (modifier?.keyword ?? []).some((k) => k.name.toLowerCase() === 'static'),
            annotations: (modifier?.annotation ?? []).map((a) => a.name),
            ...rest,
        };
    };
    const result: ApexOutlineMember[] = [
        member({
            memberType: declaration.kind,
            name: declaration.name,
            modifier: declaration.modifier,
            ...(declaration.kind === 'enum'
                ? { type: (declaration.members ?? []).map((m) => m.name).join(', ') }
                : declaration.kind === 'class' && declaration.extend
                  ? { type: apexTypeTextOf(declaration.extend) }
                  : {}),
            sourceKeys: declaration.sourceKeys.base,
        }),
    ];
    if (declaration.kind === 'interface') {
        // interface のメソッドはすべて外から使える (interface と同じ見え方)
        for (const method of declaration.block ?? []) {
            result.push(
                member({
                    memberType: 'method',
                    name: method.name,
                    params: paramsOf(method.param),
                    type: apexTypeTextOf(method.returnType),
                    modifier: method.modifier,
                    access: ownAccess,
                    sourceKeys: method.sourceKeys.base,
                }),
            );
        }
        return result;
    }
    if (declaration.kind !== 'class') return result;
    for (const block of declaration.block) {
        if (block.kind === 'initializer' || block.kind === 'notSet') continue;
        if (block.kind === 'class' || block.kind === 'interface' || block.kind === 'enum') {
            result.push(...membersOfType(block, `${owner}.${block.name}`, ownAccess, all));
            continue;
        }
        if (!all && accessOf(block.modifier) === null) continue;
        switch (block.kind) {
            case 'method':
                result.push(
                    member({
                        memberType: 'method',
                        name: block.name,
                        params: paramsOf(block.param),
                        type: apexTypeTextOf(block.returnType),
                        modifier: block.modifier,
                        sourceKeys: block.sourceKeys.base,
                    }),
                );
                break;
            case 'constructor':
                result.push(
                    member({
                        memberType: 'constructor',
                        name: block.name.join('.'),
                        params: paramsOf(block.param),
                        modifier: block.modifier,
                        sourceKeys: block.sourceKeys.base,
                    }),
                );
                break;
            case 'property':
                result.push(
                    member({
                        memberType: 'property',
                        name: block.name,
                        type: apexTypeTextOf(block.variantType),
                        modifier: block.modifier,
                        sourceKeys: block.sourceKeys.base,
                    }),
                );
                break;
            case 'field':
                for (const variant of block.variants) {
                    result.push(
                        member({
                            memberType: 'field',
                            name: variant.name,
                            type: apexTypeTextOf(block.variantType),
                            modifier: block.modifier,
                            sourceKeys: variant.sourceKeys,
                        }),
                    );
                }
                break;
        }
    }
    return result;
};

/** メンバーを見分けるキー (オーバーロードは引数の型で分ける) */
export const apexInterfaceKeyOf = (member: ApexInterfaceMember): string =>
    `${member.owner}#${member.memberType}:${member.name}${member.params ? `(${member.params.join(',')})` : ''}`;

/**
 * Apex のクラス (.cls) の、外から使えるクラス・メンバー (global・public か、@AuraEnabled などの付いたもの)。
 * テストのクラス (@isTest) とトリガー・匿名 Apex は持たない。読めなかったクラスは []
 */
export const apexInterfaceOf = (unit: ApexUnitJson): ApexInterfaceMember[] => {
    const source = unit.source;
    if (!source || source.fileType !== 'cls') return [];
    const declaration = source.content as unknown as TypeDeclaration;
    return membersOfType(declaration, declaration.name, 'global') as ApexInterfaceMember[];
};

/** クラス・メンバー 1 つ (公開に限らない。クラスの概要) */
export type ApexOutlineMember = Omit<ApexInterfaceMember, 'access'> & {
    /** global / public / protected / private (書かなければ private) / annotated (@AuraEnabled などだけ) */
    access: 'global' | 'public' | 'protected' | 'private' | 'annotated';
};

/**
 * Apex のクラス (.cls) のすべてのクラス・メンバー (アクセスに関係なく。テストのクラスも)。
 * ドキュメント・コードの理解のため (apex.outline)。トリガー・匿名 Apex と読めなかったクラスは []
 */
export const apexOutlineOf = (unit: ApexUnitJson): ApexOutlineMember[] => {
    const source = unit.source;
    if (!source || source.fileType !== 'cls') return [];
    const declaration = source.content as unknown as TypeDeclaration;
    return membersOfType(declaration, declaration.name, 'global', true);
};
