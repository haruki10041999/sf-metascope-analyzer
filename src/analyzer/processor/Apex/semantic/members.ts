import type { ApexDeclaration } from './declaration';

// 宣言の表示の名前 (依存関係・report で使う名前)。dependencies.ts と facts.ts で共通に使う (docs/plan.md 10 章 P2)
// - 型: Outer.Inner (トリガー・匿名 Apex の中の型には単位名を付けない。以前の抽出と同じ)
// - member: クラス、クラス.メソッド、トリガー名 (匿名 Apex は なし)

export type ApexMemberNames = {
    /** 宣言の ID → 宣言 */
    byId: ReadonlyMap<string, ApexDeclaration>;
    /** 宣言を所有する宣言 */
    ownerOf: (declaration: ApexDeclaration) => ApexDeclaration | undefined;
    /** 宣言の名前の並びを . でつないだもの */
    qualifiedOf: (declaration: ApexDeclaration) => string;
    /** 宣言の場所の member (変数・getter などは所有するメンバー) */
    memberOf: (declaration: ApexDeclaration | undefined) => string | undefined;
    /** 宣言を所有する、いちばん内側の型 (自分が型なら自分) */
    ownerTypeOf: (declaration: ApexDeclaration | undefined) => ApexDeclaration | undefined;
    /** テストの中か (@IsTest のクラスの中、@IsTest・testMethod のメソッドの中) */
    isTestOf: (declaration: ApexDeclaration | undefined) => boolean;
};

const isTypeDeclaration = (declaration: ApexDeclaration) =>
    declaration.kind === 'class' || declaration.kind === 'interface' || declaration.kind === 'enum';

export const apexMemberNamesOf = (declarations: readonly ApexDeclaration[]): ApexMemberNames => {
    const byId = new Map(declarations.map((d) => [d.id, d]));
    const unitRoot = declarations.find((d) => d.kind === 'trigger' || d.kind === 'anonymous');
    const ownerOf = (declaration: ApexDeclaration) =>
        declaration.ownerId ? byId.get(declaration.ownerId) : undefined;

    const qualifiedOf = (declaration: ApexDeclaration) => {
        const parts = [...declaration.path, declaration.name];
        return (
            isTypeDeclaration(declaration) &&
            unitRoot &&
            parts.length > 1 &&
            parts[0] === unitRoot.name
                ? parts.slice(1)
                : parts
        ).join('.');
    };

    const memberOf = (declaration: ApexDeclaration | undefined): string | undefined => {
        if (!declaration) return undefined;
        const owner = ownerOf(declaration);
        switch (declaration.kind) {
            case 'class':
            case 'interface':
            case 'enum':
                return qualifiedOf(declaration);
            case 'trigger':
                return declaration.name;
            case 'anonymous':
                return undefined;
            case 'method':
            case 'interfaceMethod':
            case 'constructor':
            case 'property':
                return owner ? `${qualifiedOf(owner)}.${declaration.name}` : declaration.name;
            default:
                return owner ? memberOf(owner) : undefined;
        }
    };

    const ownerTypeOf = (declaration: ApexDeclaration | undefined) => {
        for (let current = declaration; current; current = ownerOf(current)) {
            if (isTypeDeclaration(current)) return current;
        }
        return undefined;
    };

    const isTestOf = (declaration: ApexDeclaration | undefined): boolean => {
        for (let current = declaration; current; current = ownerOf(current)) {
            if (isTypeDeclaration(current) && 'isTest' in current && current.isTest) return true;
            if (
                'modifiers' in current &&
                (current.modifiers.isTestMethod ||
                    current.modifiers.annotations.some((a) => a.toLowerCase() === 'istest'))
            )
                return true;
        }
        return false;
    };

    return { byId, ownerOf, qualifiedOf, memberOf, ownerTypeOf, isTestOf };
};
