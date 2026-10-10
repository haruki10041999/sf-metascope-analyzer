import {
    ErrorTypeClass,
    ComparisonOperatorTypeClass,
    DateFormulaTypeClass,
    FieldSpecTypeClass,
    NormalQueryTypeClass,
    SearchGroupTypeClass,
    SoqlFunctionTypeClass,
    SubQueryTypeClass,
    FieldNameTypeClass,
    DateFieldNameTypeClass,
    SoqlFieldsParameterTypeClass,
    isAllRowsClauseType,
    isDateFieldNameType,
    isFieldListType,
    isFieldNameType,
    isFieldOrderListType,
    isForClausesType,
    isFromNameListType,
    isGroupByClauseType,
    isLimitClauseType,
    isLocationValueType,
    isLogicalExpressionType,
    isOffsetClauseType,
    isOrderByClauseType,
    isSelectListType,
    isSignedIntegerType,
    isSoqlFieldsParameterType,
    isSoqlFunctionType,
    isSoslIdType,
    isSubFieldListType,
    isUpdateListType,
    isUsingScopeType,
    isWhereClauseType,
    isWithClauseType,
} from '../../apex_IR';

import { toPrimitiveValue, toTypeClass } from './commons';
import { soslIdConvert } from './id';
import { fieldNameConvert, DateFieldName, dateFieldNameConvert } from './name';
import {
    FromName,
    SoslField,
    fieldListConvert,
    fieldOrderListConvert,
    fromNameListConvert,
    selectListConvert,
    subFieldListConvert,
    updateListConvert,
} from './list';
import {
    Expression,
    LogicalExpression,
    logicalExpressionConvert,
    WhereLogicalExpression,
} from './expression';
import { SignedLiteral, signedIntegerConvert } from './literal';
import { locationValueConvert } from './value';
import { soqlFieldsParameterConvert } from './parameter';
import {
    allRowsClauseConvert,
    FieldOrder,
    forClausesConvert,
    GroupByClause,
    groupByClauseConvert,
    limitClauseConvert,
    offsetClauseConvert,
    orderByClauseConvert,
    usingScopeConvert,
    whereClauseConvert,
    WithClause,
    withClauseConvert,
} from './clause';
import { SelectEntry, SubFieldEntry } from './entry';

export const comparisonOperatorConvert = (
    target: ComparisonOperatorTypeClass,
    errorClass: ErrorTypeClass[],
): string | undefined => {
    return toPrimitiveValue(
        target.getValue(),
        (target): target is string => typeof target === 'string',
        errorClass,
    );
};

export type DateFormula = {
    value?: string;
    param?: SignedLiteral;
};

export const dateFormulaConvert = (
    target: DateFormulaTypeClass,
    errorClass: ErrorTypeClass[],
): DateFormula => {
    const dateFormula: DateFormula = {};

    const value = toPrimitiveValue(
        target.getValue(),
        (target): target is string => typeof target === 'string',
        errorClass,
    );
    if (value) {
        dateFormula.value = value;
    }

    const paramValue = target.getParam();
    if (paramValue) {
        const typeClass = toTypeClass(paramValue, isSignedIntegerType, errorClass);
        if (typeClass) {
            dateFormula.param = signedIntegerConvert(typeClass, errorClass);
        }
    }

    return dateFormula;
};

export type FieldSpec = {
    value: string[];
    fieldList: SoslField[];
    where: LogicalExpression;
    listView: string[];
    orderBy: FieldOrder[];
    limitClause?: string | Expression;
    offsetClause?: Expression;
};

export const fieldSpecConvert = (
    target: FieldSpecTypeClass,
    errorClass: ErrorTypeClass[],
): FieldSpec => {
    const value: string[] = [];
    const valueTypeClass = toTypeClass(target.getValue(), isSoslIdType, errorClass);
    if (valueTypeClass) {
        value.push(...soslIdConvert(valueTypeClass, errorClass));
    }

    const fieldList: SoslField[] = [];
    const fieldListValue = target.getFieldList();
    if (fieldListValue) {
        const fieldListTypeClass = toTypeClass(fieldListValue, isFieldListType, errorClass);
        if (fieldListTypeClass) {
            fieldList.push(...fieldListConvert(fieldListTypeClass, errorClass));
        }
    }

    const listView: string[] = [];
    const listViewValue = target.getListView();
    if (listViewValue) {
        const listViewValueTypeClass = toTypeClass(listViewValue, isSoslIdType, errorClass);
        if (listViewValueTypeClass) {
            listView.push(...soslIdConvert(listViewValueTypeClass, errorClass));
        }
    }

    const orderBy: FieldOrder[] = [];
    const orderByValue = target.getOrderBy();
    if (orderByValue) {
        const orderByTypeClass = toTypeClass(orderByValue, isFieldOrderListType, errorClass);
        if (orderByTypeClass) {
            orderBy.push(...fieldOrderListConvert(orderByTypeClass, errorClass));
        }
    }

    const fieldSpec: FieldSpec = {
        value: value,
        fieldList: fieldList,
        where: {
            value: [],
        },
        listView: listView,
        orderBy: orderBy,
    };

    const whereValue = target.getWhere();
    if (whereValue) {
        const whereTypeClass = toTypeClass(whereValue, isLogicalExpressionType, errorClass);
        if (whereTypeClass) {
            const expression = logicalExpressionConvert(whereTypeClass, errorClass);
            fieldSpec.where.value.push(...expression.value);

            if (expression.operator) {
                fieldSpec.where.operator = expression.operator;
            }
        }
    }

    const limitClauseValue = target.getLimitClause();
    if (limitClauseValue) {
        const limitClauseTypeClass = toTypeClass(limitClauseValue, isLimitClauseType, errorClass);
        if (limitClauseTypeClass) {
            const expression = limitClauseConvert(limitClauseTypeClass, errorClass);
            if (expression) {
                fieldSpec.limitClause = expression;
            }
        }
    }

    const offsetClauseValue = target.getOffsetClause();
    if (offsetClauseValue) {
        const offsetClauseTypeClass = toTypeClass(
            offsetClauseValue,
            isOffsetClauseType,
            errorClass,
        );
        if (offsetClauseTypeClass) {
            const expression = offsetClauseConvert(offsetClauseTypeClass, errorClass);
            if (expression) {
                fieldSpec.limitClause = expression;
            }
        }
    }

    return fieldSpec;
};

export type NormalQuery = {
    value: SelectEntry[];
    from: FromName[];
    forClause: string[];
    whereClause: WhereLogicalExpression;
    orderByClause: FieldOrder[];
    limitClause?: string | Expression;
    updateList: string[];
    usingScope?: string;
    withClause: WithClause;
    groupByClause: GroupByClause;
    offsetClause?: string | Expression;
    allRowsClause?: string;
};

export const normalQueryConvert = (
    target: NormalQueryTypeClass,
    errorClass: ErrorTypeClass[],
): NormalQuery => {
    const value: SelectEntry[] = [];
    const valueTypeClass = toTypeClass(target.getValue(), isSelectListType, errorClass);
    if (valueTypeClass) {
        value.push(...selectListConvert(valueTypeClass, errorClass));
    }

    const from: FromName[] = [];
    const fromTypeClass = toTypeClass(target.getFrom(), isFromNameListType, errorClass);
    if (fromTypeClass) {
        from.push(...fromNameListConvert(fromTypeClass, errorClass));
    }

    const forClause: string[] = [];
    const forClauseValue = target.getForClause();
    if (forClauseValue) {
        const forClauseTypeClass = toTypeClass(forClauseValue, isForClausesType, errorClass);
        if (forClauseTypeClass) {
            forClause.push(...forClausesConvert(forClauseTypeClass, errorClass));
        }
    }

    const orderByClause: FieldOrder[] = [];
    const orderByClauseValue = target.getOrderByClause();
    if (orderByClauseValue) {
        const orderByClauseTypeClass = toTypeClass(
            orderByClauseValue,
            isOrderByClauseType,
            errorClass,
        );
        if (orderByClauseTypeClass) {
            orderByClause.push(...orderByClauseConvert(orderByClauseTypeClass, errorClass));
        }
    }

    const updateList: string[] = [];
    const updateListValue = target.getUpdateList();
    if (updateListValue) {
        const updateListTypeClass = toTypeClass(updateListValue, isUpdateListType, errorClass);
        if (updateListTypeClass) {
            updateList.push(...updateListConvert(updateListTypeClass, errorClass));
        }
    }

    const normalQuery: NormalQuery = {
        value: value,
        from: from,
        forClause: forClause,
        whereClause: {
            value: [],
        },
        orderByClause: orderByClause,
        updateList: updateList,
        withClause: {
            field: [],
        },
        groupByClause: {
            value: [],
            having: {
                value: [],
            },
        },
    };

    const whereClauseValue = target.getWhereClause();
    if (whereClauseValue) {
        const whereClauseTypeClass = toTypeClass(whereClauseValue, isWhereClauseType, errorClass);
        if (whereClauseTypeClass) {
            const whereClause = whereClauseConvert(whereClauseTypeClass, errorClass);
            normalQuery.whereClause.value.push(...whereClause.value);
            if (whereClause.operator) {
                normalQuery.whereClause.operator = whereClause.operator;
            }
        }
    }

    const withClauseValue = target.getWithClause();
    if (withClauseValue) {
        const withClauseTypeClass = toTypeClass(withClauseValue, isWithClauseType, errorClass);
        if (withClauseTypeClass) {
            const withClause = withClauseConvert(withClauseTypeClass, errorClass);
            normalQuery.withClause.field.push(...withClause.field);
            if (withClause.value) {
                normalQuery.withClause.value = withClause.value;
            }
        }
    }

    const groupByClauseValue = target.getGroupByClause();
    if (groupByClauseValue) {
        const groupByClauseTypeClass = toTypeClass(
            groupByClauseValue,
            isGroupByClauseType,
            errorClass,
        );
        if (groupByClauseTypeClass) {
            const groupByClause = groupByClauseConvert(groupByClauseTypeClass, errorClass);
            normalQuery.groupByClause.value.push(...groupByClause.value);
            normalQuery.groupByClause.having.value.push(...groupByClause.having.value);
            if (groupByClause.mode) {
                normalQuery.groupByClause.mode = groupByClause.mode;
            }
            if (groupByClause.having.operator) {
                normalQuery.groupByClause.having.operator = groupByClause.having.operator;
            }
        }
    }

    const limitClauseValue = target.getLimitClause();
    if (limitClauseValue) {
        const limitClauseTypeClass = toTypeClass(limitClauseValue, isLimitClauseType, errorClass);
        if (limitClauseTypeClass) {
            const limitClause = limitClauseConvert(limitClauseTypeClass, errorClass);
            if (limitClause) {
                normalQuery.limitClause = limitClause;
            }
        }
    }

    const usingScopeValue = target.getUsingScope();
    if (usingScopeValue) {
        const usingScopeTypeClass = toTypeClass(usingScopeValue, isUsingScopeType, errorClass);
        if (usingScopeTypeClass) {
            const usingScope = usingScopeConvert(usingScopeTypeClass, errorClass);
            if (usingScope) {
                normalQuery.usingScope = usingScope;
            }
        }
    }

    const offsetClauseValue = target.getOffsetClause();
    if (offsetClauseValue) {
        const offsetClauseTypeClass = toTypeClass(
            offsetClauseValue,
            isOffsetClauseType,
            errorClass,
        );
        if (offsetClauseTypeClass) {
            const offsetClause = offsetClauseConvert(offsetClauseTypeClass, errorClass);
            if (offsetClause) {
                normalQuery.offsetClause = offsetClause;
            }
        }
    }

    const allRowsClauseValue = target.getAllRowsClause();
    if (allRowsClauseValue) {
        const allRowsClauseTypeClass = toTypeClass(
            allRowsClauseValue,
            isAllRowsClauseType,
            errorClass,
        );
        if (allRowsClauseTypeClass) {
            const allRowsClause = allRowsClauseConvert(allRowsClauseTypeClass, errorClass);
            if (allRowsClause) {
                normalQuery.allRowsClause = allRowsClause;
            }
        }
    }

    return normalQuery;
};

export const searchGroupConvert = (
    target: SearchGroupTypeClass,
    errorClass: ErrorTypeClass[],
): string | undefined => {
    return toPrimitiveValue(
        target.getValue(),
        (target): target is string => typeof target === 'string',
        errorClass,
    );
};

export type SoqlFunction = {
    value?: string;
    param?:
        | string[]
        | DateFieldName
        | string
        | SoqlFunction
        | (string | string[] | (SignedLiteral | Expression)[] | string[] | Expression)[];
};

export const soqlFunctionConvert = (
    target: SoqlFunctionTypeClass,
    errorClass: ErrorTypeClass[],
): SoqlFunction => {
    const soqlFunction: SoqlFunction = {};

    const value = toPrimitiveValue(
        target.getValue(),
        (target): target is string => typeof target === 'string',
        errorClass,
    );
    if (value) {
        soqlFunction.value = value;
    }

    const paramValue = target.getParam();
    if (Array.isArray(paramValue)) {
        const values: (
            string | string[] | (SignedLiteral | Expression)[] | string[] | Expression
        )[] = [];
        paramValue.forEach((item) => {
            if (typeof item === 'string' || Array.isArray(item)) {
                values.push(item);
                return;
            }

            const locationTypeClass = toTypeClass(item, isLocationValueType, errorClass);
            if (locationTypeClass) {
                const locationValue = locationValueConvert(locationTypeClass, errorClass);
                if (locationValue) {
                    values.push(locationValue);
                }
            }
        });

        soqlFunction.param = values;
    } else if (paramValue) {
        const paramTypeClass = toTypeClass(
            paramValue,
            (
                target,
            ): target is
                | FieldNameTypeClass
                | DateFieldNameTypeClass
                | SoqlFieldsParameterTypeClass
                | SoqlFunctionTypeClass =>
                isFieldNameType(target) ||
                isDateFieldNameType(target) ||
                isSoqlFieldsParameterType(target) ||
                isSoqlFunctionType(target),
            errorClass,
        );

        if (paramTypeClass) {
            if (isFieldNameType(paramTypeClass)) {
                soqlFunction.param = fieldNameConvert(paramTypeClass, errorClass);
            }
            if (isDateFieldNameType(paramTypeClass)) {
                soqlFunction.param = dateFieldNameConvert(paramTypeClass, errorClass);
            }
            if (isSoqlFieldsParameterType(paramTypeClass)) {
                const parameter = soqlFieldsParameterConvert(paramTypeClass, errorClass);
                if (parameter) {
                    soqlFunction.param = parameter;
                }
            }
            if (isSoqlFunctionType(paramTypeClass)) {
                soqlFunction.param = soqlFunctionConvert(paramTypeClass, errorClass);
            }
        }
    }

    return soqlFunction;
};

export type SubQuery = {
    value: SubFieldEntry[];
    from: FromName[];
    forClause: string[];
    whereClause: WhereLogicalExpression;
    orderByClause: FieldOrder[];
    limitClause?: string | Expression;
    updateList: string[];
};

export const subQueryConvert = (
    target: SubQueryTypeClass,
    errorClass: ErrorTypeClass[],
): SubQuery => {
    const value: SubFieldEntry[] = [];
    const valueTypeClass = toTypeClass(target.getValue(), isSubFieldListType, errorClass);
    if (valueTypeClass) {
        value.push(...subFieldListConvert(valueTypeClass, errorClass));
    }

    const from: FromName[] = [];
    const fromTypeClass = toTypeClass(target.getFrom(), isFromNameListType, errorClass);
    if (fromTypeClass) {
        from.push(...fromNameListConvert(fromTypeClass, errorClass));
    }

    const forClause: string[] = [];
    const forClauseValue = target.getForClause();
    if (forClauseValue) {
        const forClauseTypeClass = toTypeClass(forClauseValue, isForClausesType, errorClass);
        if (forClauseTypeClass) {
            forClause.push(...forClausesConvert(forClauseTypeClass, errorClass));
        }
    }

    const orderByClause: FieldOrder[] = [];
    const orderByClauseValue = target.getOrderByClause();
    if (orderByClauseValue) {
        const orderByClauseTypeClass = toTypeClass(
            orderByClauseValue,
            isOrderByClauseType,
            errorClass,
        );
        if (orderByClauseTypeClass) {
            orderByClause.push(...orderByClauseConvert(orderByClauseTypeClass, errorClass));
        }
    }

    const updateList: string[] = [];
    const updateListValue = target.getUpdateList();
    if (updateListValue) {
        const updateListTypeClass = toTypeClass(updateListValue, isUpdateListType, errorClass);
        if (updateListTypeClass) {
            updateList.push(...updateListConvert(updateListTypeClass, errorClass));
        }
    }

    const subQuery: SubQuery = {
        value: value,
        from: from,
        forClause: forClause,
        whereClause: {
            value: [],
        },
        orderByClause: orderByClause,
        updateList: updateList,
    };

    const whereClauseValue = target.getWhereClause();
    if (whereClauseValue) {
        const whereClauseTypeClass = toTypeClass(whereClauseValue, isWhereClauseType, errorClass);
        if (whereClauseTypeClass) {
            const whereClause = whereClauseConvert(whereClauseTypeClass, errorClass);
            subQuery.whereClause.value.push(...whereClause.value);
            if (whereClause.operator) {
                subQuery.whereClause.operator = whereClause.operator;
            }
        }
    }

    const limitClauseValue = target.getLimitClause();
    if (limitClauseValue) {
        const limitClauseTypeClass = toTypeClass(limitClauseValue, isLimitClauseType, errorClass);
        if (limitClauseTypeClass) {
            const limitClause = limitClauseConvert(limitClauseTypeClass, errorClass);
            if (limitClause) {
                subQuery.limitClause = limitClause;
            }
        }
    }

    return subQuery;
};
