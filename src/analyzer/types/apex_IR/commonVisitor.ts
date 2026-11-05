import type { ConvertErrorCode } from '../commons/converter';
import { ApexParserBaseVisitor, ApexParserRuleContext } from '@apexdevtools/apex-parser';

import type { SourceSpan } from '../commons/source';

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

    /**
     * 子のノード (フィールドの TypeClass と ApexErrorTypeClass。lwc_IR の getChildNodes と同じ)。
     * Apex のクラスはフィールドの持ち方がクラスごとに違う (value と個別のフィールド、{ value, block } の配列など) ため、
     * 自身のプロパティから TypeClass を探す
     */
    getChildNodes(): ApexCommonTypeClass<string>[] {
        const children: ApexCommonTypeClass<string>[] = [];
        const find = (value: unknown): void => {
            if (value instanceof ApexCommonTypeClass) {
                children.push(value);
            } else if (Array.isArray(value)) {
                value.forEach(find);
            } else if (value !== null && typeof value === 'object') {
                Object.values(value).forEach(find);
            }
        };
        for (const [key, value] of Object.entries(this)) {
            if (key !== 'span') {
                find(value);
            }
        }
        return children;
    }
}

/** IR を作れなかった理由。converter の ErrorType と共通 (types/commons/converter.ts) */
export type ErrorCode = ConvertErrorCode;

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

/** visit を持つもの (各 Visitor)。visitNode などに渡す */
type ApexNodeVisitor = {
    visit: (ctx: ApexParserRuleContext) => ApexCommonTypeClass<string>;
};

/** 必須の子ノード。visit して型を確かめる (型が違えば TYPE_MISMATCH。lwc_IR の visitNode に当たる) */
export const visitNode = <T extends ApexCommonTypeClass<string>>(
    visitor: ApexNodeVisitor,
    ctx: ApexParserRuleContext,
    isValidType: (target: ApexCommonTypeClass<string>) => target is T,
    type: string,
): T | ApexErrorTypeClass => isApexValidClass(visitor.visit(ctx), isValidType, type);

/** 省略できる子ノード。ないのは正常なので null のまま返す */
export const visitOptionalNode = <T extends ApexCommonTypeClass<string>>(
    visitor: ApexNodeVisitor,
    ctx: ApexParserRuleContext | null | undefined,
    isValidType: (target: ApexCommonTypeClass<string>) => target is T,
    type: string,
): T | ApexErrorTypeClass | null =>
    ctx ? isApexValidClass(visitor.visit(ctx), isValidType, type) : null;

/** 子ノードの配列 */
export const visitNodeList = <T extends ApexCommonTypeClass<string>>(
    visitor: ApexNodeVisitor,
    ctxs: ApexParserRuleContext[] | null | undefined,
    isValidType: (target: ApexCommonTypeClass<string>) => target is T,
    type: string,
): (T | ApexErrorTypeClass)[] =>
    isApexValidClassList(ctxs ?? [], (ctx) => visitor.visit(ctx), isValidType, type);

/** IR の中の ApexErrorTypeClass を、前順に集める (lwc_IR の collectErrorTypeClasses と同じ) */
export const collectErrorTypeClasses = (
    root: ApexCommonTypeClass<string>,
): ApexErrorTypeClass[] => {
    const errors: ApexErrorTypeClass[] = [];
    const walk = (
        node: ApexCommonTypeClass<string>,
        parent: ApexCommonTypeClass<string> | null,
    ): void => {
        if (node instanceof ApexErrorTypeClass) {
            // NULL_CHILD は子がないので位置を持たない。親の位置にする
            if (!node.getSpan() && parent) {
                node.setSpan(parent.getSpan());
            }
            errors.push(node);
            return;
        }
        node.getChildNodes().forEach((child) => walk(child, node));
    };
    walk(root, null);
    return errors;
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
        return { context: '', start: startPosition, end: startPosition };
    }

    const lines = (stop.text ?? '').split('\n');
    const lastLine = lines[lines.length - 1] ?? '';
    // ctx.getText() はトークンをつなげた文字列で空白・改行・コメントを失うので、元のソースから切り出す
    const context = start.getInputStream()?.getText(start.start, stop.stop) ?? ctx.getText();
    return {
        context,
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

// 構文エラーのリスナー (ApexCommonErrorListener) は parser/Apex/errorListener.ts (lwc の LwcCommonErrorListener と同じ置き場所)
