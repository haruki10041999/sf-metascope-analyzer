import type { Node, SourceLocation } from '@babel/types';

import type { SourcePosition, SourceSpan } from '../commons/source';

export class LwcCommonTypeClass<TName extends string> {
    private type: TName;
    private span: SourceSpan | null = null;

    constructor(type: TName) {
        this.type = type;
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

export abstract class LwcCommonBaseClass<TName extends string> extends LwcCommonTypeClass<TName> {
    static abstract create(ctx: Node): LwcCommonTypeClass<TName> | LwcErrorTypeClass;
}

export type ErrorCode =
    'NULL_CHILD' | 'UNSUPPORTED_CONTEXT' | 'TYPE_MISMATCH' | 'EXCEPTION' | 'UNRESOLVED';

export class LwcErrorTypeClass extends LwcCommonTypeClass<'AnalyzerError'> {
    private code: ErrorCode;
    private contextType: string = '';
    private context: string = '';
    private errorMessage: string = '';

    private constructor(
        code: ErrorCode,
        contextType: string,
        context: string,
        errorMessage: string,
    ) {
        super('AnalyzerError');
        this.code = code;
        this.contextType = contextType;
        this.context = context;
        this.errorMessage = errorMessage;
    }

    static create(
        code: ErrorCode,
        contextType: string,
        context: string,
        errorMessage: string,
    ): LwcErrorTypeClass {
        return new LwcErrorTypeClass(code, contextType, context, errorMessage);
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

export const isLwcValidClass = <T extends LwcCommonTypeClass<string>>(
    target: LwcCommonTypeClass<string>,
    isValidType: (target: LwcCommonTypeClass<string>) => target is T,
    type: string,
): T | LwcErrorTypeClass => {
    if (isErrorType(target) || isValidType(target)) {
        return target;
    }

    // 親ノード全体を失わないよう、型不一致は子だけをエラーノードに置き換える
    const error = LwcErrorTypeClass.create(
        'TYPE_MISMATCH',
        type,
        target.getType(),
        `想定していた型と違います 想定:${type} 実値:${target.getType()}`,
    );
    error.setSpan(target.getSpan());
    return error;
};

export const isLwcValidClassList = <T extends LwcCommonTypeClass<string>>(
    ctxs: Node[],
    create: (ctx: Node) => LwcCommonTypeClass<string>,
    isValidType: (target: LwcCommonTypeClass<string>) => target is T,
    type: string,
): (T | LwcErrorTypeClass)[] => {
    if (!ctxs || ctxs.length === 0) {
        return [];
    }

    return ctxs.map((ctx) => {
        return isLwcValidClass(create(ctx), isValidType, type);
    });
};

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

type EvaluatePair<TNode extends Node, TCommonTypeClass extends LwcCommonTypeClass<string>> = {
    commonTypeClass: TCommonTypeClass;
    isNode: (target: Node) => target is TNode;
};

type AnyEvaluatePair<
    TNode extends Node,
    TCommonTypeClass extends LwcCommonTypeClass<string>,
> = EvaluatePair<TNode, TCommonTypeClass>;

export abstract class LwcCommonVisitor<
    TNode extends Node,
    TCommonTypeClass extends LwcCommonTypeClass<string>,
> {
    abstract evaluatePair: AnyEvaluatePair<Node, TCommonTypeClass>[];

    visit(ctx: Node, originalSource: string): TCommonTypeClass | LwcErrorTypeClass {
        for (const pair of this.evaluatePair) {
            if (pair.isNode(ctx)) {
                return pair.commonTypeClass;
            }
        }

        return new LwcErrorTypeClass(/* ... */);
    }
}

// Babel には ANTLR の生成 Visitor がないため、ノードの type から visitXxx を引いて呼ぶ
// (ClassProperty → visitClassProperty)。サブクラスは対応するノードの visitXxx だけを定義する
export class LwcCommonParser<T> {
    private originalSource: string;
    private;

    constructor(source: string) {
        this.originalSource = source;
    }

    visit(ctx: Node | null | undefined): T | LwcErrorTypeClass {
        // Babel の AST は任意の子要素 (初期値・戻り値の型など) が無いと null / undefined になる
        if (!ctx) {
            return LwcErrorTypeClass.create(
                'NULL_CHILD',
                'null',
                '',
                `${this.constructor.name} に子要素がありません`,
            );
        }

        const span = getSourceSpan(ctx, this.originalSource);
        const context = span?.context ?? '';
        let result: T | LwcErrorTypeClass;
        try {
            const method = (this as unknown as Record<string, unknown>)[`visit${ctx.type}`];
            const visited: unknown =
                typeof method === 'function' ? method.call(this, ctx) : undefined;
            // visitXxx が無い、または ApexCommonTypeClass 以外を返したときは弾く
            result =
                visited instanceof LwcCommonTypeClass
                    ? (visited as T | LwcErrorTypeClass)
                    : LwcErrorTypeClass.create(
                          'UNSUPPORTED_CONTEXT',
                          ctx.type,
                          context,
                          `${this.constructor.name} は ${ctx.type} に対応していません`,
                      );
        } catch (error) {
            result = LwcErrorTypeClass.create(
                'EXCEPTION',
                ctx.type,
                context,
                error instanceof Error ? error.message : String(error),
            );
        }

        (result as LwcCommonTypeClass<string>).setSpan(span);
        return result;
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
