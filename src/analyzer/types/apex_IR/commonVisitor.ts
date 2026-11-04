import {
    ApexParserBaseVisitor,
    ApexErrorListener,
    ApexParserRuleContext,
} from '@apexdevtools/apex-parser';

import type { SourcePosition, SourceSpan } from '../commons/source';

export class ApexCommonTypeClass<TName extends string> {
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

export type ErrorCode =
    'NULL_CHILD' | 'UNSUPPORTED_CONTEXT' | 'TYPE_MISMATCH' | 'EXCEPTION' | 'UNRESOLVED';

export class ApexErrorTypeClass extends ApexCommonTypeClass<'AnalyzerError'> {
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
    ): ApexErrorTypeClass {
        return new ApexErrorTypeClass(code, contextType, context, errorMessage);
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

export const isErrorType = (target: ApexCommonTypeClass<string>): target is ApexErrorTypeClass => {
    return target instanceof ApexErrorTypeClass;
};

export const isApexValidClass = <T extends ApexCommonTypeClass<string>>(
    target: ApexCommonTypeClass<string>,
    isValidType: (target: ApexCommonTypeClass<string>) => target is T,
    type: string,
): T | ApexErrorTypeClass => {
    if (isErrorType(target) || isValidType(target)) {
        return target;
    }

    // 親ノード全体を失わないよう、型不一致は子だけをエラーノードに置き換える
    const error = ApexErrorTypeClass.create(
        'TYPE_MISMATCH',
        type,
        target.getType(),
        `想定していた型と違います 想定:${type} 実値:${target.getType()}`,
    );
    error.setSpan(target.getSpan());
    return error;
};

export const isApexValidClassList = <T extends ApexCommonTypeClass<string>>(
    ctxs: ApexParserRuleContext[],
    create: (ctx: ApexParserRuleContext) => ApexCommonTypeClass<string>,
    isValidType: (target: ApexCommonTypeClass<string>) => target is T,
    type: string,
): (T | ApexErrorTypeClass)[] => {
    if (!ctxs || ctxs.length === 0) {
        return [];
    }

    return ctxs.map((ctx) => {
        return isApexValidClass(create(ctx), isValidType, type);
    });
};

export const getSourceSpan = (ctx: ApexParserRuleContext): SourceSpan | null => {
    const start = ctx.start;
    if (!start) {
        return null;
    }

    const startPosition = { offset: start.start, line: start.line, column: start.column };
    const stop = ctx.stop;
    // 空のルール（例: 次元 0 の arraySubscripts）は stop が start より前のトークンになる
    if (!stop || stop.tokenIndex < start.tokenIndex) {
        return { context: ctx.getText(), start: startPosition, end: startPosition };
    }

    const lines = (stop.text ?? '').split('\n');
    const lastLine = lines[lines.length - 1] ?? '';
    return {
        context: ctx.getText(),
        start: startPosition,
        end: {
            offset: stop.stop + 1,
            line: stop.line + lines.length - 1,
            column: lines.length > 1 ? lastLine.length : stop.column + lastLine.length,
        },
    };
};

export class ApexCommonVisitor<T> extends ApexParserBaseVisitor<T | ApexErrorTypeClass> {
    override visit(ctx: ApexParserRuleContext) {
        // 生成 getter は型上 non-null だが、任意の子要素が無いと実行時は null を返す
        if (!ctx) {
            return ApexErrorTypeClass.create(
                'NULL_CHILD',
                'null',
                '',
                `${this.constructor.name} に子要素がありません`,
            );
        }

        let result: T | ApexErrorTypeClass;
        try {
            const visited = super.visit(ctx);
            // Visitor に visitXxx が無いと visitChildren の戻り値（配列等）が返るため弾く
            result =
                visited instanceof ApexCommonTypeClass
                    ? visited
                    : ApexErrorTypeClass.create(
                          'UNSUPPORTED_CONTEXT',
                          ctx.constructor.name,
                          ctx.getText(),
                          `${this.constructor.name} は ${ctx.constructor.name} に対応していません`,
                      );
        } catch (error) {
            result = ApexErrorTypeClass.create(
                'EXCEPTION',
                ctx.constructor.name,
                ctx.getText(),
                error instanceof Error ? error.message : String(error),
            );
        }

        result.setSpan(getSourceSpan(ctx));
        return result;
    }
}

export class ApexCommonErrorListener extends ApexErrorListener {
    private originalSource: string;
    private sourceLines: string[];
    private lineOffsets: number[] = [];
    private errorTypeClass: ApexErrorTypeClass[] = [];

    constructor(source: string) {
        super();

        this.originalSource = source;
        this.sourceLines = source.split(/\r\n|\n|\r/);

        // 各行の開始位置を、元ソース上の offset として保持する
        this.lineOffsets.push(0);

        for (let i = 0; i < source.length; i++) {
            if (source[i] === '\r') {
                if (source[i + 1] === '\n') {
                    i++;
                }
                this.lineOffsets.push(i + 1);
            } else if (source[i] === '\n') {
                this.lineOffsets.push(i + 1);
            }
        }
    }

    apexSyntaxError(line: number, column: number, msg: string): void {
        const lineIndex = line - 1;
        const sourceLine = this.sourceLines[lineIndex] ?? '';
        const offset = (this.lineOffsets[lineIndex] ?? this.originalSource.length) + column;

        // エラー位置の1文字を取得。行末・EOFなら空文字
        const sourceCode = sourceLine.charAt(column);
        const hasCharacter = column < sourceLine.length;

        const start: SourcePosition = {
            offset,
            line,
            column,
        };

        const end: SourcePosition = {
            offset: offset + (hasCharacter ? 1 : 0),
            line,
            column: column + (hasCharacter ? 1 : 0),
        };

        const errorTypeClass = ApexErrorTypeClass.create('UNRESOLVED', 'unknown', sourceCode, msg);

        errorTypeClass.setSpan({
            context: sourceCode,
            start,
            end,
        });

        this.errorTypeClass.push(errorTypeClass);
    }

    getErrors(): ApexErrorTypeClass[] {
        return this.errorTypeClass;
    }
}
