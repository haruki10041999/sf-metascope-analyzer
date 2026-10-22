import typia from 'typia';

import {
    Convert,
    ConvertExcludeError,
    GenerateResult,
    ErrorJson,
    isErrorJson,
    JsonType,
    makeJsonType,
    convertExcludeError,
    collectDelteteKeys,
    mergeRecord,
    isConvert,
} from '..//commons';

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

export const makeSignedNumberJson = (
    target: ConvertExcludeError<SignedNumberType>,
): SignedNumberJson => {
    const value = target.valueType;
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

export const makeDateFormulaJson = (
    target: ConvertExcludeError<DateFormulaType>,
): DateFormulaJson => {
    const func = target.value;
    const param = target.param;

    const dateFormulaJson: DateFormulaJson = {
        func: func,
    };

    if (param) {
        const arg = param.value;
        dateFormulaJson.arg = arg;

        dateFormulaJson.argType = param.type;

        const argOperator = param.operator;
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

export const makeValueJson = (target: ConvertExcludeError<ValueType>): ValueJson => {
    const type = target.valueType;

    const value = target.value;

    if (typeof value === 'string') {
        return {
            type: type,
            value: value,
        };
    } else if (isConvert<DateFormulaType>(value)) {
        return {
            type: type,
            ...makeDateFormulaJson(value),
        };
    } else if (isConvert<SignedIntegerType>(value)) {
        return {
            type: type,
            ...makeSignedNumberJson(value),
        };
    } else if (isConvert<SubQueryType>(value)) {
        const subQueryJson = makeSubQueryJson(value as Convert<SubQueryType>);
        const { type, ...content } = subQueryJson;
        return {
            type: type,
            ...content,
        };
    } else if (isConvert<ValueListType>(value)) {
        return {
            type: type,
            value: value.value.map((v) => makeValueJson(v)),
        };
    } else {
        return {
            type: type,
            ...makeExpressionJson(value.value),
        };
    }
};

export const makeComparisonOperatorJson = (
    target: ConvertExcludeError<ComparisonOperatorType>,
): string => {
    return target.value;
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
