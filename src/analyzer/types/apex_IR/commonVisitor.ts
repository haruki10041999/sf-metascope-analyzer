import { ApexParserBaseVisitor, ApexParserRuleContext } from '@apexdevtools/apex-parser';

export type SourcePosition = {
    offset: number;
    line: number;
    column: number;
};

export type SourceSpan = {
    start: SourcePosition;
    end: SourcePosition;
};

export class CommonTypeClass {
    private type: string = '';
    private span: SourceSpan | null = null;

    constructor(type: string) {
        this.type = type;
    }

    getType(): string {
        return this.type;
    }

    getSpan(): SourceSpan | null {
        return this.span;
    }

    setSpan(span: SourceSpan | null): void {
        this.span = span;
    }
}

export type ErrorCode = 'NULL_CHILD' | 'UNSUPPORTED_CONTEXT' | 'TYPE_MISMATCH' | 'EXCEPTION';

export class ErrorTypeClass extends CommonTypeClass {
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
    ): ErrorTypeClass {
        return new ErrorTypeClass(code, contextType, context, errorMessage);
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

export const isErrorType = (target: CommonTypeClass): target is ErrorTypeClass => {
    return target instanceof ErrorTypeClass;
};

export const isValidClass = <T extends CommonTypeClass>(
    target: CommonTypeClass,
    isValidType: (target: CommonTypeClass) => target is T,
    type: string,
): T | ErrorTypeClass => {
    if (isErrorType(target) || isValidType(target)) {
        return target;
    }

    // 親ノード全体を失わないよう、型不一致は子だけをエラーノードに置き換える
    const error = ErrorTypeClass.create(
        'TYPE_MISMATCH',
        type,
        target.getType(),
        `想定していた型と違います 想定:${type} 実値:${target.getType()}`,
    );
    error.setSpan(target.getSpan());
    return error;
};

export const isValidClassList = <T extends CommonTypeClass>(
    ctxs: ApexParserRuleContext[],
    create: (ctx: ApexParserRuleContext) => CommonTypeClass,
    isValidType: (target: CommonTypeClass) => target is T,
    type: string,
): (T | ErrorTypeClass)[] => {
    if (!ctxs || ctxs.length === 0) {
        return [];
    }

    return ctxs.map((ctx) => {
        return isValidClass(create(ctx), isValidType, type);
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
        return { start: startPosition, end: startPosition };
    }

    const lines = (stop.text ?? '').split('\n');
    const lastLine = lines[lines.length - 1] ?? '';
    return {
        start: startPosition,
        end: {
            offset: stop.stop + 1,
            line: stop.line + lines.length - 1,
            column: lines.length > 1 ? lastLine.length : stop.column + lastLine.length,
        },
    };
};

export class CommonVisitor<T> extends ApexParserBaseVisitor<T | ErrorTypeClass> {
    override visit(ctx: ApexParserRuleContext) {
        // 生成 getter は型上 non-null だが、任意の子要素が無いと実行時は null を返す
        if (!ctx) {
            return ErrorTypeClass.create(
                'NULL_CHILD',
                'null',
                '',
                `${this.constructor.name} に子要素がありません`,
            );
        }

        let result: T | ErrorTypeClass;
        try {
            const visited = super.visit(ctx);
            // Visitor に visitXxx が無いと visitChildren の戻り値（配列等）が返るため弾く
            result =
                visited instanceof CommonTypeClass
                    ? visited
                    : ErrorTypeClass.create(
                          'UNSUPPORTED_CONTEXT',
                          ctx.constructor.name,
                          ctx.getText(),
                          `${this.constructor.name} は ${ctx.constructor.name} に対応していません`,
                      );
        } catch (error) {
            result = ErrorTypeClass.create(
                'EXCEPTION',
                ctx.constructor.name,
                ctx.getText(),
                error instanceof Error ? error.message : String(error),
            );
        }

        (result as CommonTypeClass).setSpan(getSourceSpan(ctx));
        return result;
    }
}
