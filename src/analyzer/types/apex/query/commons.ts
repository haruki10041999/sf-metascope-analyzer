import typia from 'typia';

import {
    Convert,
    isConvert,
    ErrorJson,
    JsonType,
    SourceJson,
    searchConvertAll,
    isError,
    writeSourceKeys,
    removeSourceInfo,
    castExcludeErrorInfo,
    castExcludeErrorInfoArray,
    castConvert,
    castConvertArray,
    isErrorJson,
} from '../commons';

import {
    ValueType,
    SignedNumberType,
    DateFormulaType,
    SubQueryType,
    ValueListType,
    BoundExpressionType,
    SignedIntegerType,
    ComparisonOperatorType,
    FieldExpressionType,
    LogicalExpressionType,
    SoqlFunctionType,
    isDateFormulaType,
    isSignedNumberType,
    isValueListType,
    isSubQueryType,
    isBoundExpressionType,
    isFieldExpressionType,
    isFieldNameType,
    isSoqlFunctionType,
} from '../converter';

import { ExpressionJson, makeExpressionJson } from '../expression';
import { SubQueryJson, makeSubQueryJson } from './subQuery';
import { SoqlFunctionJson, makeSoqlFunctionJson } from './soqlFunction';

export type SignedNumberJson = {
    value: string;
    valueType: string;
    operator?: string;
};
export const isSignedNumberJson = typia.createIs<SignedNumberJson>();

export const makeSignedNumberJson = (target: Convert<SignedNumberType>): SignedNumberJson => {
    const value = castExcludeErrorInfo(target.value);
    const valueType = target.valueType;
    const operator = target.operator;

    const signedNumberJson: SignedNumberJson = {
        value: value,
        valueType: valueType,
    };

    if (operator) {
        signedNumberJson.operator = operator;
    }

    return signedNumberJson;
};

export type DateFormulaJson = {
    func: string;
    arg?: string;
    argType?: string;
    argOperator?: string;
};
export const isDateFormulaJson = typia.createIs<DateFormulaJson>();

export const makeDateFormulaJson = (target: Convert<DateFormulaType>): DateFormulaJson => {
    const func = castExcludeErrorInfo(target.value);
    const param = castExcludeErrorInfo(target.param);

    const dateFormulaJson: DateFormulaJson = {
        func: func,
    };

    if (param) {
        const _param = castConvert(param);

        const arg = castExcludeErrorInfo(_param.value);
        dateFormulaJson.arg = arg;

        dateFormulaJson.argType = _param.type;

        const argOperator = _param.operator;
        if (argOperator) {
            dateFormulaJson.argOperator = argOperator;
        }
    }

    return dateFormulaJson;
};

export type ValueJson = {
    type: string;
} & (
    | { value: string }
    | SignedNumberJson
    | DateFormulaJson
    | Omit<SubQueryJson, 'type'>
    | { value: ValueJson[] }
    | ExpressionJson
);
export const isValueJson = typia.createIs<ValueJson>();

export const makeValueJson = (target: Convert<ValueType>): ValueJson => {
    const type = target.type;

    const value = castExcludeErrorInfo(target.value);
    const _value = typeof value === 'string' ? value : castConvert(value);

    if (typeof _value === 'string') {
        return {
            type: type,
            value: _value,
        };
    } else if (isConvert(_value, isDateFormulaType)) {
        return {
            type: type,
            ...makeDateFormulaJson(_value),
        };
    } else if (isConvert(_value, isSignedNumberType)) {
        return {
            type: type,
            ...makeSignedNumberJson(_value),
        };
    } else if (isConvert(_value, isSubQueryType)) {
        const subQueryJson = makeSubQueryJson(_value);
        const { type, ...content } = subQueryJson;
        return {
            type: type,
            ...content,
        };
    } else if (isConvert(_value, isValueListType)) {
        const valueList = castConvertArray(castExcludeErrorInfoArray(_value.value));

        return {
            type: type,
            value: valueList.map((v) => makeValueJson(v)),
        };
    } else {
        const __value = _value as Convert<BoundExpressionType>;
        const expression = castConvert(castExcludeErrorInfo(__value.value));
        return {
            type: type,
            ...makeExpressionJson(expression),
        };
    }
};

export const makeComparisonOperatorJson = (target: Convert<ComparisonOperatorType>): string => {
    return castExcludeErrorInfo(target.value);
};

export type SingleConditionJson = {
    field: { type: 'field'; name: string[] } | SoqlFunctionJson;
    operator: string;
    value: ValueJson;
};

export const isSingleConditionJson = typia.createIs<SingleConditionJson>();

export const makeSingleConditionJson = (
    target: Convert<FieldExpressionType>,
): SingleConditionJson => {
    const field = castConvert(castExcludeErrorInfo(target.left));
    const operator = makeComparisonOperatorJson(castConvert(castExcludeErrorInfo(target.operator)));
    const value = makeValueJson(castConvert(castExcludeErrorInfo(target.right)));

    if (isConvert(field, isFieldNameType)) {
        const fieldValue = castConvertArray(castExcludeErrorInfoArray(field.value)).map(
            (v) => castConvert(castExcludeErrorInfo(v.value)).value,
        );

        return {
            field: { type: 'field', name: fieldValue },
            operator: operator,
            value: value,
        };
    } else {
        const _field = field as Convert<SoqlFunctionType>;
        const fieldValue = makeSoqlFunctionJson(_field);

        return {
            field: fieldValue,
            operator: operator,
            value: value,
        };
    }
};

export type LogicalConditionJson = {
    operator?: string;
    condition: (SingleConditionJson | LogicalConditionJson)[];
};
export const isLogicalConditionJson = typia.createIs<LogicalConditionJson>();

export const makeLogicalConditionJson = (
    target: Convert<LogicalExpressionType>,
): LogicalConditionJson => {
    const operator = target.operator;
    const condition = castConvertArray(castExcludeErrorInfoArray(target.value)).map((c) => {
        const conditionalExpression = castConvert(castExcludeErrorInfo(c.value));
        if (isConvert(conditionalExpression, isFieldExpressionType)) {
            return makeSingleConditionJson(conditionalExpression);
        } else {
            const _conditionalExpression = conditionalExpression as Convert<LogicalExpressionType>;
            return makeLogicalConditionJson(_conditionalExpression);
        }
    });

    const logicalConditonJson: LogicalConditionJson = {
        condition: condition,
    };

    if (operator) {
        logicalConditonJson.operator = operator;
    }

    return logicalConditonJson;
};
