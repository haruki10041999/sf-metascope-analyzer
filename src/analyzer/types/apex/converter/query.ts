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
import { SoslId, soslIdConvert } from './id';
import { FieldName, fieldNameConvert, DateFieldName, dateFieldNameConvert } from './name';
import {
    FieldList,
    fieldListConvert,
    FieldOrderList,
    fieldOrderListConvert,
    FromNameList,
    fromNameListConvert,
    SelectList,
    selectListConvert,
    SubFieldList,
    subFieldListConvert,
    UpdateList,
    updateListConvert,
} from './list';
import { LogicalExpression, logicalExpressionConvert } from './expression';
import { SignedInteger, signedIntegerConvert } from './literal';
import { LocationValue, locationValueConvert } from './value';
import { SoqlFieldsParameter, soqlFieldsParameterConvert } from './parameter';
import {
    AllRowsClause,
    allRowsClauseConvert,
    ForClauses,
    forClausesConvert,
    GroupByClause,
    groupByClauseConvert,
    LimitClause,
    limitClauseConvert,
    OffsetClause,
    offsetClauseConvert,
    OrderByClause,
    orderByClauseConvert,
    UsingScope,
    usingScopeConvert,
    WhereClause,
    whereClauseConvert,
    WithClause,
    withClauseConvert,
} from './clause';

export type ComparisonOperator = string | undefined;

export const comparisonOperatorConvert = (
    target: ComparisonOperatorTypeClass,
    errorClass: ErrorTypeClass[],
): ComparisonOperator => {
    return toPrimitiveValue(
        target.getValue(),
        (target): target is string => typeof target === 'string',
        errorClass,
    );
};

export type DateFormula = {
    value: string | undefined;
    param: SignedInteger | undefined;
};

export const dateFormulaConvert = (
    target: DateFormulaTypeClass,
    errorClass: ErrorTypeClass[],
): DateFormula => {
    const value = toPrimitiveValue(
        target.getValue(),
        (target): target is string => typeof target === 'string',
        errorClass,
    );

    const paramValue = target.getParam();
    const paramTypeClass = paramValue
        ? toTypeClass(paramValue, isSignedIntegerType, errorClass)
        : undefined;

    return {
        value: value,
        param: paramTypeClass ? signedIntegerConvert(paramTypeClass, errorClass) : undefined,
    };
};

export type FieldSpec = {
    value: SoslId;
    fieldList: FieldList;
    where: LogicalExpression | undefined;
    listView: SoslId;
    orderBy: FieldOrderList;
    limitClause: LimitClause | undefined;
    offsetClause: OffsetClause | undefined;
};

export const fieldSpecConvert = (
    target: FieldSpecTypeClass,
    errorClass: ErrorTypeClass[],
): FieldSpec => {
    const valueTypeClass = toTypeClass(target.getValue(), isSoslIdType, errorClass);

    const fieldListValue = target.getFieldList();
    const fieldListTypeClass = fieldListValue
        ? toTypeClass(fieldListValue, isFieldListType, errorClass)
        : undefined;

    const whereValue = target.getWhere();
    const whereTypeClass = whereValue
        ? toTypeClass(whereValue, isLogicalExpressionType, errorClass)
        : undefined;

    const listViewValue = target.getListView();
    const listViewTypeClass = listViewValue
        ? toTypeClass(listViewValue, isSoslIdType, errorClass)
        : undefined;

    const orderByValue = target.getOrderBy();
    const orderByTypeClass = orderByValue
        ? toTypeClass(orderByValue, isFieldOrderListType, errorClass)
        : undefined;

    const limitClauseValue = target.getLimitClause();
    const limitClauseTypeClass = limitClauseValue
        ? toTypeClass(limitClauseValue, isLimitClauseType, errorClass)
        : undefined;

    const offsetClauseValue = target.getOffsetClause();
    const offsetClauseTypeClass = offsetClauseValue
        ? toTypeClass(offsetClauseValue, isOffsetClauseType, errorClass)
        : undefined;

    return {
        value: valueTypeClass ? soslIdConvert(valueTypeClass, errorClass) : undefined,
        fieldList: fieldListTypeClass
            ? fieldListConvert(fieldListTypeClass, errorClass)
            : undefined,
        where: whereTypeClass ? logicalExpressionConvert(whereTypeClass, errorClass) : undefined,
        listView: listViewTypeClass ? soslIdConvert(listViewTypeClass, errorClass) : undefined,
        orderBy: orderByTypeClass ? fieldOrderListConvert(orderByTypeClass, errorClass) : undefined,
        limitClause: limitClauseTypeClass
            ? limitClauseConvert(limitClauseTypeClass, errorClass)
            : undefined,
        offsetClause: offsetClauseTypeClass
            ? offsetClauseConvert(offsetClauseTypeClass, errorClass)
            : undefined,
    };
};

type SoqlQueryBase = {
    from: FromNameList;
    forClause: ForClauses;
    whereClause: WhereClause;
    orderByClause: OrderByClause;
    limitClause: LimitClause | undefined;
    updateList: UpdateList;
};

const soqlQueryBaseConvert = (
    target: NormalQueryTypeClass | SubQueryTypeClass,
    errorClass: ErrorTypeClass[],
): SoqlQueryBase => {
    const fromTypeClass = toTypeClass(target.getFrom(), isFromNameListType, errorClass);

    const forClauseValue = target.getForClause();
    const forClauseTypeClass = forClauseValue
        ? toTypeClass(forClauseValue, isForClausesType, errorClass)
        : undefined;

    const whereClauseValue = target.getWhereClause();
    const whereClauseTypeClass = whereClauseValue
        ? toTypeClass(whereClauseValue, isWhereClauseType, errorClass)
        : undefined;

    const orderByClauseValue = target.getOrderByClause();
    const orderByClauseTypeClass = orderByClauseValue
        ? toTypeClass(orderByClauseValue, isOrderByClauseType, errorClass)
        : undefined;

    const limitClauseValue = target.getLimitClause();
    const limitClauseTypeClass = limitClauseValue
        ? toTypeClass(limitClauseValue, isLimitClauseType, errorClass)
        : undefined;

    const updateListValue = target.getUpdateList();
    const updateListTypeClass = updateListValue
        ? toTypeClass(updateListValue, isUpdateListType, errorClass)
        : undefined;

    return {
        from: fromTypeClass ? fromNameListConvert(fromTypeClass, errorClass) : undefined,
        forClause: forClauseTypeClass
            ? forClausesConvert(forClauseTypeClass, errorClass)
            : undefined,
        whereClause: whereClauseTypeClass
            ? whereClauseConvert(whereClauseTypeClass, errorClass)
            : undefined,
        orderByClause: orderByClauseTypeClass
            ? orderByClauseConvert(orderByClauseTypeClass, errorClass)
            : undefined,
        limitClause: limitClauseTypeClass
            ? limitClauseConvert(limitClauseTypeClass, errorClass)
            : undefined,
        updateList: updateListTypeClass
            ? updateListConvert(updateListTypeClass, errorClass)
            : undefined,
    };
};

export type NormalQuery = { value: SelectList } & SoqlQueryBase & {
        usingScope: UsingScope;
        withClause: WithClause | undefined;
        groupByClause: GroupByClause | undefined;
        offsetClause: OffsetClause | undefined;
        allRowsClause: AllRowsClause;
    };

export const normalQueryConvert = (
    target: NormalQueryTypeClass,
    errorClass: ErrorTypeClass[],
): NormalQuery => {
    const valueTypeClass = toTypeClass(target.getValue(), isSelectListType, errorClass);

    const usingScopeValue = target.getUsingScope();
    const usingScopeTypeClass = usingScopeValue
        ? toTypeClass(usingScopeValue, isUsingScopeType, errorClass)
        : undefined;

    const withClauseValue = target.getWithClause();
    const withClauseTypeClass = withClauseValue
        ? toTypeClass(withClauseValue, isWithClauseType, errorClass)
        : undefined;

    const groupByClauseValue = target.getGroupByClause();
    const groupByClauseTypeClass = groupByClauseValue
        ? toTypeClass(groupByClauseValue, isGroupByClauseType, errorClass)
        : undefined;

    const offsetClauseValue = target.getOffsetClause();
    const offsetClauseTypeClass = offsetClauseValue
        ? toTypeClass(offsetClauseValue, isOffsetClauseType, errorClass)
        : undefined;

    const allRowsClauseValue = target.getAllRowsClause();
    const allRowsClauseTypeClass = allRowsClauseValue
        ? toTypeClass(allRowsClauseValue, isAllRowsClauseType, errorClass)
        : undefined;

    return {
        value: valueTypeClass ? selectListConvert(valueTypeClass, errorClass) : undefined,
        ...soqlQueryBaseConvert(target, errorClass),
        usingScope: usingScopeTypeClass
            ? usingScopeConvert(usingScopeTypeClass, errorClass)
            : undefined,
        withClause: withClauseTypeClass
            ? withClauseConvert(withClauseTypeClass, errorClass)
            : undefined,
        groupByClause: groupByClauseTypeClass
            ? groupByClauseConvert(groupByClauseTypeClass, errorClass)
            : undefined,
        offsetClause: offsetClauseTypeClass
            ? offsetClauseConvert(offsetClauseTypeClass, errorClass)
            : undefined,
        allRowsClause: allRowsClauseTypeClass
            ? allRowsClauseConvert(allRowsClauseTypeClass, errorClass)
            : undefined,
    };
};

export type SearchGroup = string | undefined;

export const searchGroupConvert = (
    target: SearchGroupTypeClass,
    errorClass: ErrorTypeClass[],
): SearchGroup => {
    return toPrimitiveValue(
        target.getValue(),
        (target): target is string => typeof target === 'string',
        errorClass,
    );
};

export type SoqlFunction = {
    value: string | undefined;
    param:
        | FieldName
        | DateFieldName
        | SoqlFieldsParameter
        | SoqlFunction
        | (string | string[] | LocationValue)[]
        | undefined;
};

export const soqlFunctionConvert = (
    target: SoqlFunctionTypeClass,
    errorClass: ErrorTypeClass[],
): SoqlFunction => {
    const value = toPrimitiveValue(
        target.getValue(),
        (target): target is string => typeof target === 'string',
        errorClass,
    );

    const paramValue = target.getParam();
    let param: SoqlFunction['param'] = undefined;
    if (Array.isArray(paramValue)) {
        const values: (string | string[] | LocationValue)[] = [];
        paramValue.forEach((item) => {
            if (typeof item === 'string' || Array.isArray(item)) {
                values.push(item);
                return;
            }
            const locationTypeClass = toTypeClass(item, isLocationValueType, errorClass);
            if (locationTypeClass) {
                values.push(locationValueConvert(locationTypeClass, errorClass));
            }
        });
        param = values.length > 0 ? values : undefined;
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
                param = fieldNameConvert(paramTypeClass, errorClass);
            }
            if (isDateFieldNameType(paramTypeClass)) {
                param = dateFieldNameConvert(paramTypeClass, errorClass);
            }
            if (isSoqlFieldsParameterType(paramTypeClass)) {
                param = soqlFieldsParameterConvert(paramTypeClass, errorClass);
            }
            if (isSoqlFunctionType(paramTypeClass)) {
                param = soqlFunctionConvert(paramTypeClass, errorClass);
            }
        }
    }

    return {
        value: value,
        param: param,
    };
};

export type SubQuery = {
    value: SubFieldList;
} & SoqlQueryBase;

export const subQueryConvert = (
    target: SubQueryTypeClass,
    errorClass: ErrorTypeClass[],
): SubQuery => {
    const valueTypeClass = toTypeClass(target.getValue(), isSubFieldListType, errorClass);

    return {
        value: valueTypeClass ? subFieldListConvert(valueTypeClass, errorClass) : undefined,
        ...soqlQueryBaseConvert(target, errorClass),
    };
};
