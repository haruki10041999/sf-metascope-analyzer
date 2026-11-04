import type { Node, SourceLocation } from '@babel/types';

import type { SourcePosition, SourceSpan } from '../commons/source';

// Babel の Position は SourcePosition と同じ基準 (line は 1 始まり、column / index は 0 始まり、
// loc.end は範囲の次の文字) なので、index を offset に移すだけでよい。Position 自体は export されていない
const toSourcePosition = (position: SourceLocation['start']): SourcePosition => ({
    offset: position.index,
    line: position.line,
    column: position.column,
});

// Babel のノードは getText() を持たないため、元のソースから切り出す
export const getSourceSpan = (ctx: Node, source: string): SourceSpan | null => {
    if (!ctx.loc) {
        return null;
    }

    return {
        context: source.slice(ctx.loc.start.index, ctx.loc.end.index),
        start: toSourcePosition(ctx.loc.start),
        end: toSourcePosition(ctx.loc.end),
    };
};

export class LwcCommonTypeClass<TName extends string> {
    private type: TName;
    private originalSource: string;
    private span: SourceSpan | null = null;

    constructor(type: TName, originalSource: string) {
        this.type = type;
        this.originalSource = originalSource;
    }

    getOriginalSource(): string {
        return this.originalSource;
    }

    getType(): TName {
        return this.type;
    }

    getSpan(): SourceSpan | null {
        return this.span;
    }

    setSpan(span: SourceSpan | null): void {
        this.span = span;
    }
}

export type ErrorCode =
    'NULL_CHILD' | 'UNSUPPORTED_CONTEXT' | 'TYPE_MISMATCH' | 'EXCEPTION' | 'UNRESOLVED';

export class LwcErrorTypeClass extends LwcCommonTypeClass<'AnalyzerError'> {
    private code: ErrorCode;
    private contextType: string = '';
    private context: string = '';
    private errorMessage: string = '';

    private constructor(
        originalSource: string,
        code: ErrorCode,
        contextType: string,
        context: string,
        errorMessage: string,
    ) {
        super('AnalyzerError', originalSource);
        this.code = code;
        this.contextType = contextType;
        this.context = context;
        this.errorMessage = errorMessage;
    }

    static create(
        originalSource: string,
        code: ErrorCode,
        contextType: string,
        context: string,
        errorMessage: string,
    ): LwcErrorTypeClass {
        return new LwcErrorTypeClass(originalSource, code, contextType, context, errorMessage);
    }

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
}

export const isErrorType = (target: LwcCommonTypeClass<string>): target is LwcErrorTypeClass => {
    return target instanceof LwcErrorTypeClass;
};

export type EvaluatePair<
    TNode extends Node,
    TCommonTypeClass extends LwcCommonTypeClass<string>,
> = {
    isNode: (target: Node | null | undefined) => target is TNode;
    instance: (target: Node, originalSource: string) => TCommonTypeClass;
};

export const makeEvaluatePair = <
    TNode extends Node,
    TCommonTypeClass extends LwcCommonTypeClass<string>,
>(
    isNode: (target: Node | null | undefined) => target is TNode,
    instance: (target: TNode, originalSource: string) => TCommonTypeClass,
): EvaluatePair<TNode, TCommonTypeClass> => ({
    isNode,
    instance: (target, originalSource) => {
        if (!isNode(target)) {
            throw new Error(`想定していた Babel ノード型と違います: ${target.type}`);
        }
        return instance(target, originalSource);
    },
});

type EvaluatePairInstance<TPair> = TPair extends {
    instance: (
        target: Node,
        originalSource: string,
    ) => infer TResult extends LwcCommonTypeClass<string>;
}
    ? TResult
    : never;

export abstract class LwcCommonVisitor<
    TEvaluatePair extends {
        isNode: (target: Node | null | undefined) => boolean;
        instance: (target: Node, originalSource: string) => LwcCommonTypeClass<string>;
    },
> {
    abstract evaluatePair: readonly TEvaluatePair[];

    visit(
        ctx: Node | null | undefined,
        originalSource: string,
    ): EvaluatePairInstance<TEvaluatePair> | LwcErrorTypeClass {
        if (!ctx) {
            return LwcErrorTypeClass.create(
                originalSource,
                'NULL_CHILD',
                'null',
                '',
                `${this.constructor.name} に子要素がありません`,
            );
        }

        const span = getSourceSpan(ctx, originalSource);
        const context = span?.context ?? '';

        let result: LwcCommonTypeClass<string> | LwcErrorTypeClass | undefined;

        try {
            for (const pair of this.evaluatePair) {
                if (pair.isNode(ctx)) {
                    result = pair.instance(ctx, originalSource);
                    break;
                }
            }
            if (!result) {
                result = LwcErrorTypeClass.create(
                    originalSource,
                    'UNSUPPORTED_CONTEXT',
                    ctx.type,
                    context,
                    `${this.constructor.name} は ${ctx.type} に対応していません`,
                );
            }
        } catch (error) {
            result = LwcErrorTypeClass.create(
                originalSource,
                'EXCEPTION',
                ctx.type,
                context,
                error instanceof Error ? error.message : String(error),
            );
        }

        result.setSpan(span);

        return result as EvaluatePairInstance<TEvaluatePair> | LwcErrorTypeClass;
    }
}

/** Babel の構文エラー (ast.errors の要素、または parse が throw したもの) */
type BabelSyntaxError = Error & {
    code: string;
    reasonCode: string;
    loc: SourceLocation['start'];
    pos: number;
};

export const isBabelSyntaxError = (error: unknown): error is BabelSyntaxError =>
    error instanceof SyntaxError && 'reasonCode' in error && 'loc' in error;

// Babel にはリスナーがないため、回復できたエラー (ast.errors) と throw されたエラーを受け取って集める
export class LwcCommonErrorListener {
    private originalSource: string;
    private errorTypeClass: LwcErrorTypeClass[] = [];

    constructor(source: string) {
        this.originalSource = source;
    }

    babelSyntaxError(error: BabelSyntaxError): void {
        // loc は開始位置だけ。Apex と同じく、エラー位置の 1 文字を範囲にする (行末・EOF なら空)
        const start = toSourcePosition(error.loc);
        const sourceCode = this.originalSource.charAt(start.offset);
        const hasCharacter = sourceCode !== '' && sourceCode !== '\n';

        const end: SourcePosition = {
            offset: start.offset + (hasCharacter ? 1 : 0),
            line: start.line,
            column: start.column + (hasCharacter ? 1 : 0),
        };

        // message の末尾の " (行:列)" は span と重なるので除く
        const message = error.message.replace(/ \(\d+:\d+\)$/, '');
        const errorTypeClass = LwcErrorTypeClass.create(
            this.originalSource,
            'UNRESOLVED',
            error.reasonCode,
            sourceCode,
            message,
        );

        errorTypeClass.setSpan({
            context: sourceCode,
            start,
            end,
        });

        this.errorTypeClass.push(errorTypeClass);
    }

    getErrors(): LwcErrorTypeClass[] {
        return this.errorTypeClass;
    }
}
