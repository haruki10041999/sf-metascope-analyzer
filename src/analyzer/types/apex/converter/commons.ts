import typia from 'typia';

import {
    CommonTypeClass,
    ErrorTypeClass,
    SourceSpan,
    SourcePosition,
    ErrorCode,
    isErrorType,
    NormalIdTypeClass,
    isNormalIdType,
    AnyIdTypeClass,
    isAnyIdType,
} from '../../apex_IR';

export type SourceInfo = {
    context: string;
    start: SourcePosition;
    end: SourcePosition;
};

export const isSourceInfo = typia.createIs<SourceInfo>();

export const makeSourceInfo = (typeClass: CommonTypeClass): SourceInfo | null => {
    const span = typeClass.getSpan();
    return span ? { context: span.context, start: span.start, end: span.end } : null;
};

/**
 * 変換結果と同じ形をしたソース位置の木。
 * `fields` のキーは rule が返すオブジェクトのプロパティ名に一致させる。
 * rule が子の値をそのまま（オブジェクトに包まずに）返す場合は `value` を使う。
 * 例: 出力 `result.modifier[2]` の位置は `source.fields.modifier[2].span`。
 */
export type SourceNode = {
    /** IR の型名。if 分岐のような IR 型を持たない中間要素は null */
    type: string | null;
    span: SourceInfo | null;
    fields: SourceFields;
};

export type SourceFields = {
    [field: string]: SourceNode | (SourceNode | null)[] | null;
};

/** rule が自分の SourceNode を書き込む先。親が sourceField / sourceList で用意する */
export type SourceSlot = (node: SourceNode) => void;

export const makeSourceNode = (typeClass: CommonTypeClass): SourceNode => ({
    type: typeClass.getType(),
    span: makeSourceInfo(typeClass),
    fields: {},
});

export const makeSourceGroup = (): SourceNode => ({ type: null, span: null, fields: {} });

/** 子が無い・エラーの場合も出力と形を揃えるため、キーは呼び出し時点で null として確保する */
export const sourceField = (parent: SourceNode, name: string): SourceSlot => {
    if (!Object.hasOwn(parent.fields, name)) {
        parent.fields[name] = null;
    }
    return (node) => {
        parent.fields[name] = node;
    };
};

export const sourceList = (parent: SourceNode, name: string): ((index: number) => SourceSlot) => {
    const current = parent.fields[name];
    const items: (SourceNode | null)[] = Array.isArray(current) ? current : [];
    parent.fields[name] = items;
    return (index) => {
        while (items.length <= index) {
            items.push(null);
        }
        return (node) => {
            items[index] = node;
        };
    };
};

/** @deprecated 旧出力層（types/apex 直下）向け。converter では SourceNode を使う */
export type SourceInfoMap = {
    [key: string]: string | SourceInfo | SourceInfoMap;
};

/** @deprecated 旧出力層（types/apex 直下）向け。converter では SourceNode を使う */
export const makeEmptySourceInfoMap = (): SourceInfoMap => {
    return {};
};

export type ErrorInfo = {
    errorCode: ErrorCode;
    contextType: string;
    context: string;
    start: SourcePosition;
    end: SourcePosition;
};

export const isErrorInfo = typia.createIs<ErrorInfo>();
export const makeErrorInfo = (typeClass: ErrorTypeClass): ErrorInfo => {
    return {
        errorCode: typeClass.getCode(),
        contextType: typeClass.getContextType(),
        context: typeClass.getContext(),
        start: typeClass.getSpan()!.start,
        end: typeClass.getSpan()!.end,
    };
};

export const isTargetTypeClass = <T extends CommonTypeClass>(
    target: unknown,
    isValid: (target: CommonTypeClass) => target is T,
): target is T => {
    return target instanceof CommonTypeClass && isValid(target);
};

type AnyAssignRule = {
    isValid: (target: unknown) => target is unknown;
    construct: (target: never) => unknown;
};

export type ValueRuleValue<T> = T | { errorCode: ErrorCode; index: number } | null;

export type AssignForValueRule<TValue, TResult> = {
    isValid: (target: unknown) => target is TValue;
    construct: (target: TValue) => TResult;
};

export const makeOutputErrorAssignRule = {
    isValid: (target: unknown) => isTargetTypeClass(target, isErrorType),
    construct: (target: ErrorTypeClass): ErrorInfo => {
        return makeErrorInfo(target);
    },
};
export const makeErrorAssignRule = (
    errorInfo: ErrorInfo[],
): AssignForValueRule<ErrorTypeClass, { errorCode: ErrorCode; index: number }> => ({
    isValid: (target: unknown) => isTargetTypeClass(target, isErrorType),
    construct: (typeClass: ErrorTypeClass) => {
        const error = makeErrorInfo(typeClass);
        errorInfo.push(error);
        return { errorCode: error.errorCode, index: errorInfo.length };
    },
});

type AssignForValueRuleResult<TRule> =
    TRule extends AssignForValueRule<infer _TValue, infer TResult> ? TResult : never;

export const assignMultiClass = <const TRules extends readonly AnyAssignRule[]>(
    typeClass: unknown,
    isAssignList: TRules,
): AssignForValueRuleResult<TRules[number]> | null => {
    if (typeClass) {
        for (const rule of isAssignList) {
            if (rule.isValid(typeClass)) {
                return rule.construct(typeClass as never) as AssignForValueRuleResult<
                    TRules[number]
                >;
            }
        }
    }

    return null;
};
