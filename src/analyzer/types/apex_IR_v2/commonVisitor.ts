import { ApexParserBaseVisitor, ApexParserRuleContext } from '@apexdevtools/apex-parser';

import {
    CommonTypeClass,
    ErrorCode,
    TypeField,
    ErrorField,
    ErrorOutputFuncsution,
} from '../commons/ir';
import type { SourceSpan } from '../commons/source';

export class ApexCommonTypeClass<
    TName extends string,
    TField extends TypeField<TName>,
> extends CommonTypeClass<TName, TField> {
    constructor(
        type: TName,
        properties: Omit<TField, 'type'> = {} as Omit<TField, 'type'>,
        sourceSpan: SourceSpan,
    ) {
        super(type, properties, sourceSpan);
    }

    getChildNodes() {
        return this.findChildren(
            (target): target is ApexCommonTypeClass<string, TypeField<string>> =>
                target instanceof ApexCommonTypeClass,
        );
    }
}

export class ApexErrorTypeClass
    extends ApexCommonTypeClass<'analyzerError', ErrorField>
    implements ErrorOutputFuncsution
{
    private constructor(
        code: ErrorCode,
        contextType: string,
        context: string,
        errorMessage: string,
        sourceSpan: SourceSpan,
    ) {
        super(
            'analyzerError',
            {
                code: code,
                contextType: contextType,
                context: context,
                errorMessage: errorMessage,
            },
            sourceSpan,
        );
    }

    static create(
        code: ErrorCode,
        contextType: string,
        context: string,
        errorMessage: string,
        sourceSpan: SourceSpan,
    ): ApexErrorTypeClass {
        return new ApexErrorTypeClass(code, contextType, context, errorMessage, sourceSpan);
    }

    getCode() {
        return this.getFields().code;
    }

    getContextType() {
        return this.getFields().contextType;
    }

    getContext(): string {
        return this.getFields().context;
    }

    getParseErrorMessage(): string {
        return this.getFields().errorMessage;
    }
}

export const isSpicifyApexCommonTypeClass = <
    TName extends string,
    TField extends TypeField<TName>,
    TApexCommonTypeClass extends ApexCommonTypeClass<TName, TField>,
>(
    type: TName,
    target: ApexCommonTypeClass<TName, TField>,
): target is TApexCommonTypeClass => {
    return target instanceof ApexCommonTypeClass && target.getType() === type;
};

export const isApexErrorTypeClass = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is ApexErrorTypeClass => {
    return isSpicifyApexCommonTypeClass('analyzerError', target);
};

export const isApexValidClass = <T extends ApexCommonTypeClass<string, TypeField<string>>>(
    target: ApexCommonTypeClass<string, TypeField<string>>,
    isValidTypeClass: (target: ApexCommonTypeClass<string, TypeField<string>>) => target is T,
    type: string,
): T | ApexErrorTypeClass => {
    if (isApexErrorTypeClass(target) || isValidTypeClass(target)) {
        return target;
    }

    // 親ノード全体を失わないよう、型不一致は子だけをエラーノードに置き換える
    const error = ApexErrorTypeClass.create(
        'TYPE_MISMATCH',
        type,
        target.getType(),
        `想定していた型と違います 想定:${type} 実値:${target.getType()}`,
        target.getSpan(),
    );
    return error;
};

export const isApexValidClassList = <T extends ApexCommonTypeClass<string, TypeField<string>>>(
    ctxs: ApexParserRuleContext[],
    create: (ctx: ApexParserRuleContext) => ApexCommonTypeClass<string, TypeField<string>>,
    isValidType: (target: ApexCommonTypeClass<string, TypeField<string>>) => target is T,
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
    visit: (ctx: ApexParserRuleContext) => ApexCommonTypeClass<string, TypeField<string>>;
};

/** 必須の子ノード。visit して型を確かめる (型が違えば TYPE_MISMATCH。lwc_IR の visitNode に当たる) */
export const visitNode = <T extends ApexCommonTypeClass<string, TypeField<string>>>(
    visitor: ApexNodeVisitor,
    ctx: ApexParserRuleContext,
    isValidType: (target: ApexCommonTypeClass<string, TypeField<string>>) => target is T,
    type: string,
): T | ApexErrorTypeClass => isApexValidClass(visitor.visit(ctx), isValidType, type);

/** 省略できる子ノード。ないのは正常なので null のまま返す */
export const visitOptionalNode = <T extends ApexCommonTypeClass<string, TypeField<string>>>(
    visitor: ApexNodeVisitor,
    ctx: ApexParserRuleContext | null | undefined,
    isValidType: (target: ApexCommonTypeClass<string, TypeField<string>>) => target is T,
    type: string,
): T | ApexErrorTypeClass | null =>
    ctx ? isApexValidClass(visitor.visit(ctx), isValidType, type) : null;

/** 子ノードの配列 */
export const visitNodeList = <T extends ApexCommonTypeClass<string, TypeField<string>>>(
    visitor: ApexNodeVisitor,
    ctxs: ApexParserRuleContext[] | null | undefined,
    isValidType: (target: ApexCommonTypeClass<string, TypeField<string>>) => target is T,
    type: string,
): (T | ApexErrorTypeClass)[] =>
    isApexValidClassList(ctxs ?? [], (ctx) => visitor.visit(ctx), isValidType, type);

/** IR の中の ApexErrorTypeClass を、前順に集める (lwc_IR の collectErrorTypeClasses と同じ) */
export const collectErrorTypeClasses = (
    root: ApexCommonTypeClass<string, TypeField<string>>,
): ApexErrorTypeClass[] => {
    const errors: ApexErrorTypeClass[] = [];
    const walk = (
        node: ApexCommonTypeClass<string, TypeField<string>>,
        parent: ApexCommonTypeClass<string, TypeField<string>> | null,
    ): void => {
        if (node instanceof ApexErrorTypeClass) {
            errors.push(node);
            return;
        }
        node.getChildNodes().forEach((child) => walk(child, node));
    };
    walk(root, null);
    return errors;
};

export const getSourceSpan = (ctx: ApexParserRuleContext): SourceSpan => {
    const start = ctx.start;
    if (!start) {
        return {
            context: '',
            start: { offset: -1, line: -1, column: -1 },
            end: { offset: -1, line: -1, column: -1 },
        };
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

export class ApexCommonVisitor<
    T extends ApexCommonTypeClass<string, TypeField<string>>,
> extends ApexParserBaseVisitor<T | ApexErrorTypeClass> {
    override visit(ctx: ApexParserRuleContext) {
        // 生成 getter は型上 non-null だが、任意の子要素が無いと実行時は null を返す
        if (!ctx) {
            return ApexErrorTypeClass.create(
                'NULL_CHILD',
                'null',
                '',
                `${this.constructor.name} に子要素がありません`,
                getSourceSpan(ctx),
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
                          getSourceSpan(ctx),
                      );
        } catch (error) {
            result = ApexErrorTypeClass.create(
                'EXCEPTION',
                ctx.constructor.name,
                ctx.getText(),
                error instanceof Error ? error.message : String(error),
                getSourceSpan(ctx),
            );
        }
        return result;
    }
}
