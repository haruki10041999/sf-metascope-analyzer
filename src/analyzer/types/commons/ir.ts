import { createHash } from 'node:crypto';

const HASH_LENGTH = 16;
const hash = (value: unknown): string => {
    // BigInt (10n など) は JSON にできないので、文字列にする
    const json = JSON.stringify(value, (_key, v: unknown) =>
        typeof v === 'bigint' ? `${v.toString()}n` : v,
    );
    return createHash('sha256').update(json).digest('hex').slice(0, HASH_LENGTH);
};

export const isRecord = (value: unknown): value is Record<string, unknown> => {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
};

const sortKeys = (value: unknown): unknown => {
    if (Array.isArray(value)) {
        return value.map((v) => sortKeys(v));
    }
    if (!isRecord(value)) {
        return value;
    }
    return Object.fromEntries(
        Object.keys(value)
            .sort()
            .map((key) => [key, sortKeys(value[key])]),
    );
};

export type SourceKeys = {
    objectKey: string;
    sourceKey: string;
};

export type TypeField<TName extends string> = {
    type: TName;
};

export type SourcePosition = {
    offset: number;
    line: number;
    column: number;
};

export type SourceSpan = {
    context: string;
    start: SourcePosition;
    end: SourcePosition;
};

export type SourceObject = {
    objectKey: string;
    context: string;
    source: ({ sourceKey: string } & Omit<SourceSpan, 'context'>)[];
};

/** 文字位置 → SourcePosition (行・列) の変換を作る。改行は LF にそろえておく */
export const makePositionOf = (source: string) => {
    const lineStarts = [0];
    for (let i = 0; i < source.length; i++) {
        if (source[i] === '\n') lineStarts.push(i + 1);
    }
    return (offset: number): SourcePosition => {
        let low = 0;
        let high = lineStarts.length - 1;
        while (low < high) {
            const middle = (low + high + 1) >> 1;
            if (lineStarts[middle]! <= offset) low = middle;
            else high = middle - 1;
        }
        return { offset, line: low + 1, column: offset - lineStarts[low]! };
    };
};

/**
 * フィールドから type を除いたもの (コンストラクタに渡す形)。
 * フィールドが判別 union のときも、選択肢ごとに type を除く (Omit は union の選択肢をまとめてしまい、
 * 種類と中身の組み合わせが失われるため)
 */
export type FieldsOf<TField> = TField extends unknown ? Omit<TField, 'type'> : never;

export abstract class CommonTypeClass<TName extends string, TField extends TypeField<TName>> {
    /** ノードの種類 (フィールドの type と同じ)。ノードの和を TypeScript で絞り込むのに使う (node.kind === 'xxx') */
    readonly kind: TName;
    private field: Readonly<TField>;
    private sourceSpan: SourceSpan;
    /** getSourceKeys で初めて読まれたときに作る (ノードは作ったあと変わらないので、作り直さない) */
    private sourceKeys: SourceKeys | undefined;

    constructor(
        type: TName,
        properties: FieldsOf<TField> = {} as FieldsOf<TField>,
        sourceSpan: SourceSpan,
    ) {
        this.kind = type;
        this.field = {
            type,
            ...properties,
        } as unknown as TField;
        this.sourceSpan = sourceSpan;
    }

    /**
     * ノードのキー。形は `type_ハッシュ` (docs/ir-integration.md 3.3)。
     * - objectKey: フィールドの中身から作る。子ノードは子の objectKey に置きかえるので、中身が同じ部分木は同じキーになる。
     *   フィールドの順には依らない
     * - sourceKey: ソースの位置 (start・end) から作る
     */
    getSourceKeys(): SourceKeys {
        if (!this.sourceKeys) {
            const { context: _context, ...position } = this.sourceSpan;
            this.sourceKeys = {
                objectKey: `${this.kind}_${hash(sortKeys(toKeyBody(this.field)))}`,
                sourceKey: `${this.kind}_${hash(position)}`,
            };
        }
        return this.sourceKeys;
    }

    getFields(): Readonly<TField> {
        return this.field;
    }

    getType(): TName {
        return this.getFields().type;
    }

    getSpan(): SourceSpan {
        return this.sourceSpan;
    }

    protected findChildren<T extends CommonTypeClass<string, TypeField<string>>>(
        isT: (target: unknown) => target is T,
    ): T[] {
        const children: T[] = [];

        const find = (target: unknown): void => {
            if (isT(target)) {
                children.push(target);
                return;
            }

            if (Array.isArray(target)) {
                target.forEach(find);
                return;
            }

            if (target !== null && typeof target === 'object') {
                Object.values(target).forEach(find);
            }
        };

        find(this.getFields());

        return children;
    }

    abstract getChildNodes(): CommonTypeClass<string, TypeField<string>>[];
}

/** objectKey の元になる中身。子ノードは子の objectKey に置きかえる (部分木を何度もたどらないため) */
const toKeyBody = (value: unknown): unknown => {
    if (value instanceof CommonTypeClass) return value.getSourceKeys().objectKey;
    if (Array.isArray(value)) return value.map(toKeyBody);
    if (value === null || typeof value !== 'object') return value;
    return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, toKeyBody(child)]));
};

/** 位置が分からない (-1) ノードは、ソース位置の一覧に入れない */
const hasPosition = (span: SourceSpan): boolean =>
    ![span.start, span.end].some((position) =>
        Object.values(position).every((value) => value === -1),
    );

/**
 * 木のソース位置の一覧。親を子より先に (前順) たどり、同じ objectKey のものは 1 つにまとめる
 * (JSON 層の regenerateSourceObjects が、JSON で使ったキーだけに絞る)
 */
export const collectSourceObjects = (
    root: CommonTypeClass<string, TypeField<string>>,
): SourceObject[] => {
    const sourceObjects = new Map<string, SourceObject>();
    const visit = (node: CommonTypeClass<string, TypeField<string>>): void => {
        const span = node.getSpan();
        if (hasPosition(span)) {
            const { objectKey, sourceKey } = node.getSourceKeys();
            const { context, start, end } = span;
            const sourceObject = sourceObjects.get(objectKey);
            if (sourceObject) {
                sourceObject.source.push({ sourceKey, start, end });
            } else {
                sourceObjects.set(objectKey, {
                    objectKey,
                    context,
                    source: [{ sourceKey, start, end }],
                });
            }
        }
        node.getChildNodes().forEach(visit);
    };
    visit(root);
    return [...sourceObjects.values()];
};

export type ErrorCode =
    'NULL_CHILD' | 'UNSUPPORTED_CONTEXT' | 'TYPE_MISMATCH' | 'EXCEPTION' | 'UNRESOLVED';

// ---------------------------------------------------------------------------
// IR を作れなかったところ。解析木には残さず、集めて resolvedError に渡す (docs/ir.md 4 章)
// ---------------------------------------------------------------------------

/** リスナー (parser/Apex/errorListener.ts・parser/Lwc/errorListener.ts) が受け取るエラーの形 */
export interface IrErrorLike {
    getCode(): string;
    getContextType(): string;
    getContext(): string;
    getParseErrorMessage(): string;
    getSpan(): SourceSpan | null;
}

/** IR を作れなかったところ 1 つ */
export class IrError implements IrErrorLike {
    constructor(
        readonly code: ErrorCode,
        readonly contextType: string,
        readonly context: string,
        readonly errorMessage: string,
        readonly span: SourceSpan,
    ) {}

    getCode(): ErrorCode {
        return this.code;
    }

    getContextType(): string {
        return this.contextType;
    }

    getContext(): string {
        return this.context;
    }

    getParseErrorMessage(): string {
        return this.errorMessage;
    }

    getSpan(): SourceSpan {
        return this.span;
    }
}

/**
 * 子ノードを作れなかったことを、区切り (省略できる子・配列の要素・解析の単位) まで伝える例外。
 * 区切りで捕まえて IrError を集め、その子は木に入れない (省略できる子は null、配列の要素は除く)
 */
export class IrBuildError extends Error {
    constructor(readonly error: IrError) {
        super(error.errorMessage);
        this.name = 'IrBuildError';
    }
}

/** 今集めている IrError (collectIrErrors の中だけ) */
let currentErrors: IrError[] | null = null;

/** IrError を集める (collectIrErrors の外では捨てる) */
export const reportIrError = (error: IrError): void => {
    currentErrors?.push(error);
};

/**
 * 区切り: build が IrBuildError を投げたら、IrError を集めて fallback を返す。
 * IrBuildError 以外の例外は、そのまま上に伝える
 */
export const recoverIrBuild = <T, F>(build: () => T, fallback: F): T | F => {
    try {
        return build();
    } catch (error) {
        if (error instanceof IrBuildError) {
            reportIrError(error.error);
            return fallback;
        }
        throw error;
    }
};

const UNKNOWN_SPAN: SourceSpan = {
    context: '',
    start: { offset: -1, line: -1, column: -1 },
    end: { offset: -1, line: -1, column: -1 },
};

/**
 * 解析の単位 (ファイル) の IR を作り、作れなかったところ (IrError) を集める。
 * 単位そのものを作れなかったときは result が null (そのときのエラーも errors に入る)
 */
export const collectIrErrors = <T>(build: () => T): { result: T | null; errors: IrError[] } => {
    const previous = currentErrors;
    const errors: IrError[] = [];
    currentErrors = errors;
    try {
        return { result: build(), errors };
    } catch (error) {
        errors.push(
            error instanceof IrBuildError
                ? error.error
                : new IrError(
                      'EXCEPTION',
                      'unit',
                      '',
                      error instanceof Error ? error.message : String(error),
                      UNKNOWN_SPAN,
                  ),
        );
        return { result: null, errors };
    } finally {
        currentErrors = previous;
    }
};
