import { makePositionOf, type SourcePosition } from './source';

// メタデータの XML (*-meta.xml) を、要素ごとのソース位置付きの木にする。
// Apex の IR (apex_IR) に当たる層。fast-xml-parser は位置を返さないため、sourceKey を作れるよう自前で読む。
// Salesforce のメタデータで使う範囲 (要素・属性・テキスト・実体参照・コメント・CDATA・XML 宣言) だけを扱う。

export type XmlElement = {
    name: string;
    attributes: Record<string, string>;
    children: XmlElement[];
    /** 直下のテキストを連結し、前後の空白を除いたもの (実体参照は戻す) */
    text: string;
    /** 開始タグの `<` (行は 1 始まり、列は 0 始まり。Apex の SourcePosition と同じ) */
    start: SourcePosition;
    /** 終了タグの `>` の次 */
    end: SourcePosition;
    /**
     * 中身 (開始タグの `>` の次から終了タグの `<` まで) のオフセット。`<a/>` は持たない。
     * テキストの中の位置 (数式のノードの位置) を出すのに使う (textOffsetsOf)
     */
    content?: { start: number; end: number };
    /** 属性の値 (引用符の中) のオフセット。値の中の位置 (差し込みの位置) を出すのに使う */
    attributeSpans?: Record<string, { start: number; end: number }>;
    /**
     * 要素を読んだファイル。分解された形式 (decomposed) を 1 つの単位に組み立てたときだけ持つ
     * (位置を、組み立てたファイルではなく元のファイルで登録するため)
     */
    file?: { filePath: string; source: string };
};

export class XmlSyntaxError extends Error {
    readonly position: SourcePosition;
    /** 位置を含まないメッセージ */
    readonly reason: string;

    constructor(reason: string, position: SourcePosition) {
        super(`${reason} (line ${position.line}, column ${position.column})`);
        this.name = 'XmlSyntaxError';
        this.position = position;
        this.reason = reason;
    }
}

const ENTITIES: Record<string, string> = {
    amp: '&',
    lt: '<',
    gt: '>',
    quot: '"',
    apos: "'",
};

const decodeEntities = (text: string): string =>
    text.replace(/&(#x[0-9a-fA-F]+|#[0-9]+|[a-zA-Z]+);/g, (whole, entity: string) => {
        if (entity.startsWith('#x')) return String.fromCodePoint(parseInt(entity.slice(2), 16));
        if (entity.startsWith('#')) return String.fromCodePoint(parseInt(entity.slice(1), 10));
        return ENTITIES[entity] ?? whole;
    });

const NAME = /[A-Za-z_:][-A-Za-z0-9_:.]*/y;
const ATTRIBUTE = /\s*([A-Za-z_:][-A-Za-z0-9_:.]*)\s*=\s*("([^"]*)"|'([^']*)')/y;

/** XML を読み、ルート要素を返す。改行コードは呼び出し側で LF にそろえておく */
export const parseXml = (source: string): XmlElement => {
    const positionOf = makePositionOf(source);
    let index = 0;

    const fail = (message: string, at: number = index): never => {
        throw new XmlSyntaxError(message, positionOf(Math.min(at, source.length)));
    };

    /** XML 宣言・処理命令・コメント・DOCTYPE・空白を読み飛ばす */
    const skipMisc = () => {
        for (;;) {
            const rest = source.slice(index);
            const space = /^\s+/.exec(rest);
            if (space) {
                index += space[0].length;
                continue;
            }
            const close = rest.startsWith('<?')
                ? '?>'
                : rest.startsWith('<!--')
                  ? '-->'
                  : rest.startsWith('<!DOCTYPE')
                    ? '>'
                    : undefined;
            if (!close) return;
            const end = source.indexOf(close, index);
            if (end === -1) fail(`unterminated ${rest.slice(0, 4)}`);
            index = end + close.length;
        }
    };

    const readName = (): string => {
        NAME.lastIndex = index;
        const match = NAME.exec(source);
        if (!match) fail('element name expected');
        index += match![0].length;
        return match![0];
    };

    const readElement = (): XmlElement => {
        const startOffset = index;
        if (source[index] !== '<') fail('`<` expected');
        index++;
        const name = readName();

        const attributes: Record<string, string> = {};
        const attributeSpans: Record<string, { start: number; end: number }> = {};
        for (;;) {
            ATTRIBUTE.lastIndex = index;
            const match = ATTRIBUTE.exec(source);
            if (!match) break;
            const raw = match[3] ?? match[4] ?? '';
            attributes[match[1]!] = decodeEntities(raw);
            // 値は閉じる引用符の前
            const valueEnd = index + match[0].length - 1;
            attributeSpans[match[1]!] = { start: valueEnd - raw.length, end: valueEnd };
            index += match[0].length;
        }
        while (/\s/.test(source[index] ?? '')) index++;

        const element = (
            children: XmlElement[],
            text: string,
            content?: { start: number; end: number },
        ): XmlElement => ({
            name,
            attributes,
            children,
            text: text.trim(),
            start: positionOf(startOffset),
            end: positionOf(index),
            ...(content ? { content } : {}),
            ...(Object.keys(attributeSpans).length ? { attributeSpans } : {}),
        });

        if (source.startsWith('/>', index)) {
            index += 2;
            return element([], '');
        }
        if (source[index] !== '>') fail(`\`>\` expected in <${name}>`);
        index++;

        const contentStart = index;
        const children: XmlElement[] = [];
        let text = '';
        for (;;) {
            if (index >= source.length) fail(`</${name}> expected`, startOffset);
            if (source.startsWith('</', index)) {
                const contentEnd = index;
                index += 2;
                const closeName = readName();
                if (closeName !== name) fail(`</${name}> expected but </${closeName}> found`);
                while (/\s/.test(source[index] ?? '')) index++;
                if (source[index] !== '>') fail('`>` expected');
                index++;
                return element(children, text, { start: contentStart, end: contentEnd });
            }
            if (source.startsWith('<!--', index)) {
                const end = source.indexOf('-->', index);
                if (end === -1) fail('unterminated comment');
                index = end + 3;
                continue;
            }
            if (source.startsWith('<![CDATA[', index)) {
                const end = source.indexOf(']]>', index);
                if (end === -1) fail('unterminated CDATA');
                text += source.slice(index + 9, end);
                index = end + 3;
                continue;
            }
            if (source[index] === '<') {
                children.push(readElement());
                continue;
            }
            const next = source.indexOf('<', index);
            const end = next === -1 ? source.length : next;
            text += decodeEntities(source.slice(index, end));
            index = end;
        }
    };

    skipMisc();
    if (index >= source.length) fail('root element expected');
    const root = readElement();
    skipMisc();
    if (index < source.length) fail('unexpected content after the root element');
    return root;
};

/** 名前が name の子要素 */
export const childrenOf = (element: XmlElement, name: string): XmlElement[] =>
    element.children.filter((child) => child.name === name);

/** 名前が name の最初の子要素 */
export const childOf = (element: XmlElement, name: string): XmlElement | undefined =>
    element.children.find((child) => child.name === name);

/** テキストと、その各文字のソースの中の範囲 (start は文字の最初、end は次。文字は UTF-16 の単位) */
export type DecodedText = { text: string; starts: number[]; ends: number[] };

/**
 * ソースの範囲 [start, end) のテキストを読み戻す。実体参照 (`&lt;`) は 1 文字で、範囲は実体参照の全体。
 * CDATA の中はそのまま。コメントは飛ばす。children の要素 (範囲の中にあるもの) も飛ばす
 */
export const decodeRange = (
    source: string,
    start: number,
    end: number,
    children: readonly XmlElement[] = [],
): DecodedText => {
    const chars: string[] = [];
    const starts: number[] = [];
    const ends: number[] = [];
    const push = (text: string, from: number, to: number) => {
        for (const ch of text.split('')) {
            chars.push(ch);
            starts.push(from);
            ends.push(to);
        }
    };
    const rest = [...children];
    let index = start;
    while (index < end) {
        if (source.startsWith('<!--', index)) {
            index = source.indexOf('-->', index) + 3;
        } else if (source.startsWith('<![CDATA[', index)) {
            const close = source.indexOf(']]>', index);
            for (let i = index + 9; i < close; i++) push(source[i]!, i, i + 1);
            index = close + 3;
        } else if (source[index] === '<') {
            // 子要素 (読んだ順に並んでいる)
            const child = rest.shift();
            index = child ? child.end.offset : end;
        } else if (source[index] === '&') {
            const match = /^&(#x[0-9a-fA-F]+|#[0-9]+|[a-zA-Z]+);/.exec(source.slice(index, end));
            const raw = match ? match[0] : '&';
            push(match ? decodeEntities(raw) : '&', index, index + raw.length);
            index += raw.length;
        } else {
            push(source[index]!, index, index + 1);
            index++;
        }
    }
    return { text: chars.join(''), starts, ends };
};

/** 読み戻したテキストの前後の空白を除く (範囲も合わせる) */
export const trimDecoded = ({ text, starts, ends }: DecodedText): DecodedText => {
    const head = text.length - text.trimStart().length;
    const length = text.trim().length;
    return {
        text: text.trim(),
        starts: starts.slice(head, head + length),
        ends: ends.slice(head, head + length),
    };
};

/**
 * 要素の直下のテキスト (element.text と同じもの) の各文字の、ソースの中の範囲。
 * source は要素を読んだファイルの中身 (element.file があればその source)。中身がない要素は undefined
 */
export const textOffsetsOf = (
    element: XmlElement,
    source: string,
): { starts: number[]; ends: number[] } | undefined => {
    if (!element.content) return undefined;
    const { starts, ends } = trimDecoded(
        decodeRange(source, element.content.start, element.content.end, element.children),
    );
    return { starts, ends };
};
