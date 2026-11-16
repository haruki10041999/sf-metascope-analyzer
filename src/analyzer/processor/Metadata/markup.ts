import { formulaTextOf, type FxMergeJson } from '../../types/metadata/formula';
import { metadataRecordsOf } from './walker';

// マークアップ (Visualforce・Aura) とテンプレート (メール・Flow のテキストテンプレート) の派生の情報 (段階 M6)。
// 以前は JSON に持っていた「使っている部品のタグ」「差し込みの中身」を、木から出す

const MERGE = /\{[!#]([^}]*)\}/g;

/** 木の中の名前空間付きのタグ (apex:outputText・c:myComponent など。重複なし・名前の順) */
export const markupTagsOf = (body: unknown): string[] =>
    [
        ...new Set(
            metadataRecordsOf(body).flatMap((node) =>
                node.kind === 'markupElement' &&
                typeof node.tag === 'string' &&
                node.tag.includes(':')
                    ? [node.tag]
                    : [],
            ),
        ),
    ].sort();

/**
 * 差し込み ({!...} / {#...}) の中身 (前後の空白を除く。重複なし・名前の順)。
 * 木 (や JSON) の中の fxMerge と、読めなかった差し込み (文字列のまま残ったもの)・texts の文字列 (宣言の属性など) の {!...}
 */
export const mergeTextsOf = (tree: unknown, texts: readonly string[] = []): string[] => {
    const found: string[] = [];
    for (const node of metadataRecordsOf(tree)) {
        if (node.kind === 'fxMerge') {
            found.push(formulaTextOf((node as unknown as FxMergeJson).expression).trim());
        }
        if (node.kind === 'fxTemplate' && Array.isArray(node.parts)) {
            for (const part of node.parts) {
                if (typeof part === 'string') texts = [...texts, part];
            }
        }
    }
    for (const text of texts) {
        for (const match of text.matchAll(MERGE)) found.push(match[1]!.trim());
    }
    return [...new Set(found.filter(Boolean))].sort();
};
