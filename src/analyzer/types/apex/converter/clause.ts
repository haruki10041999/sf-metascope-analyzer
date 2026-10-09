import {
    ErrorTypeClass,
    CatchClauseTypeClass,
    AllRowsClauseTypeClass,
    OffsetClauseTypeClass,
    LimitClauseTypeClass,
    ForClausesTypeClass,
    ElseClauseTypeClass,
    GroupByClauseTypeClass,
    OrderByClauseTypeClass,
    WithClauseTypeClass,
    WhereClauseTypeClass,
    WhenClauseTypeClass,
    SoslWithClauseTypeClass,
    SoslClausesTypeClass,
    DataCategorySelectionTypeClass,
    FieldGroupByTypeClass,
    FieldOrderTypeClass,
    FilteringSelectorTypeClass,
    UpdateTypeTypeClass,
    UsingScopeTypeClass,
    TypeOfTypeClass,
    FieldNameTypeClass,
    SoqlFunctionTypeClass,
    BoundExpressionTypeClass,
    FilteringExpressionTypeClass,
    NetworkListTypeClass,
    isElseClauseType,
    isLimitClauseType,
    isWhenClauseType,
    isSoslWithClauseType,
    isFilteringSelectorType,
    isBoundExpressionType,
    isDataCategoryNameType,
    isFieldGroupByListType,
    isFieldNameListType,
    isFieldNameType,
    isFieldOrderListType,
    isFieldSpecListType,
    isFilteringExpressionType,
    isLogicalExpressionType,
    isNetworkListType,
    isNormalBlockType,
    isNormalIdType,
    isQualifiedNameType,
    isSearchGroupType,
    isSoqlFunctionType,
    isSoqlIdType,
    isUpdateListType,
    isWhereLogicalExpressionType,
} from '../../apex_IR';

import { toPrimitiveValue, toTypeClass } from './commons';
import { NormalId, normalIdConvert, SoqlId, soqlIdConvert } from './id';
import {
    QualifiedName,
    qualifiedNameConvert,
    FieldName,
    fieldNameConvert,
    DataCategoryName,
    dataCategoryNameConvert,
} from './name';
import { NormalBlock, normalBlockConvert } from './block';
import { NormalModifier, normalModifierListConvert } from './modifier';
import {
    FieldNameList,
    fieldNameListConvert,
    FieldGroupByList,
    fieldGroupByListConvert,
    FieldOrderList,
    fieldOrderListConvert,
    FieldSpecList,
    fieldSpecListConvert,
    UpdateList,
    updateListConvert,
    NetworkList,
    networkListConvert,
} from './list';
import {
    BoundExpression,
    boundExpressionConvert,
    FilteringExpression,
    filteringExpressionConvert,
    LogicalExpression,
    logicalExpressionConvert,
    WhereLogicalExpression,
    whereLogicalExpressionConvert,
} from './expression';
import { SoqlFunction, soqlFunctionConvert, SearchGroup, searchGroupConvert } from './query';

const fieldNameOrSoqlFunctionConvert = (
    target: FieldNameTypeClass | SoqlFunctionTypeClass | ErrorTypeClass,
    errorClass: ErrorTypeClass[],
): FieldName | SoqlFunction | undefined => {
    const valueTypeClass = toTypeClass(
        target,
        (target): target is FieldNameTypeClass | SoqlFunctionTypeClass =>
            isFieldNameType(target) || isSoqlFunctionType(target),
        errorClass,
    );

    if (valueTypeClass) {
        if (isFieldNameType(valueTypeClass)) {
            return fieldNameConvert(valueTypeClass, errorClass);
        }
        if (isSoqlFunctionType(valueTypeClass)) {
            return soqlFunctionConvert(valueTypeClass, errorClass);
        }
    }

    return undefined;
};

export type AllRowsClause = string | undefined;

export const allRowsClauseConvert = (
    target: AllRowsClauseTypeClass,
    errorClass: ErrorTypeClass[],
): AllRowsClause => {
    return toPrimitiveValue(
        target.getValue(),
        (target): target is string => typeof target === 'string',
        errorClass,
    );
};

export type CatchClause = {
    value: NormalId | undefined;
    valueType: QualifiedName;
    block: NormalBlock;
    modifier: NormalModifier[] | undefined;
};

export const catchClauseConvert = (
    target: CatchClauseTypeClass,
    errorClass: ErrorTypeClass[],
): CatchClause => {
    const valueTypeClass = toTypeClass(target.getValue(), isNormalIdType, errorClass);
    const valueTypeTypeClass = toTypeClass(target.getValueType(), isQualifiedNameType, errorClass);
    const blockTypeClass = toTypeClass(target.getBlock(), isNormalBlockType, errorClass);

    return {
        value: valueTypeClass ? normalIdConvert(valueTypeClass) : undefined,
        valueType: valueTypeTypeClass
            ? qualifiedNameConvert(valueTypeTypeClass, errorClass)
            : undefined,
        block: blockTypeClass ? normalBlockConvert(blockTypeClass, errorClass) : undefined,
        modifier: normalModifierListConvert(target.getModifier(), errorClass),
    };
};

export type DataCategorySelection = {
    value: SoqlId;
    selector: FilteringSelector;
    category: DataCategoryName;
};

export const dataCategorySelectionConvert = (
    target: DataCategorySelectionTypeClass,
    errorClass: ErrorTypeClass[],
): DataCategorySelection => {
    const valueTypeClass = toTypeClass(target.getValue(), isSoqlIdType, errorClass);
    const selectorTypeClass = toTypeClass(
        target.getSelector(),
        isFilteringSelectorType,
        errorClass,
    );
    const categoryTypeClass = toTypeClass(target.getCategory(), isDataCategoryNameType, errorClass);

    return {
        value: valueTypeClass ? soqlIdConvert(valueTypeClass, errorClass) : undefined,
        selector: selectorTypeClass
            ? filteringSelectorConvert(selectorTypeClass, errorClass)
            : undefined,
        category: categoryTypeClass
            ? dataCategoryNameConvert(categoryTypeClass, errorClass)
            : undefined,
    };
};

export type ElseClause = FieldNameList;

export const elseClauseConvert = (
    target: ElseClauseTypeClass,
    errorClass: ErrorTypeClass[],
): ElseClause => {
    const valueTypeClass = toTypeClass(target.getValue(), isFieldNameListType, errorClass);
    return valueTypeClass ? fieldNameListConvert(valueTypeClass, errorClass) : undefined;
};

export type FieldGroupBy = FieldName | SoqlFunction | undefined;

export const fieldGroupByConvert = (
    target: FieldGroupByTypeClass,
    errorClass: ErrorTypeClass[],
): FieldGroupBy => {
    return fieldNameOrSoqlFunctionConvert(target.getValue(), errorClass);
};

export type FieldOrder = {
    value: FieldName | SoqlFunction | undefined;
    direction: string | undefined;
    nulls: string | undefined;
};

export const fieldOrderConvert = (
    target: FieldOrderTypeClass,
    errorClass: ErrorTypeClass[],
): FieldOrder => {
    return {
        value: fieldNameOrSoqlFunctionConvert(target.getValue(), errorClass),
        direction: target.getDirection() ?? undefined,
        nulls: target.getNulls() ?? undefined,
    };
};

export type FilteringSelector = string | undefined;

export const filteringSelectorConvert = (
    target: FilteringSelectorTypeClass,
    errorClass: ErrorTypeClass[],
): FilteringSelector => {
    return toPrimitiveValue(
        target.getValue(),
        (target): target is string => typeof target === 'string',
        errorClass,
    );
};

export type ForClauses = string[] | undefined;

export const forClausesConvert = (
    target: ForClausesTypeClass,
    errorClass: ErrorTypeClass[],
): ForClauses => {
    const values: string[] = [];
    target.getValue().forEach((item) => {
        const value = toPrimitiveValue(
            item,
            (target): target is string => typeof target === 'string',
            errorClass,
        );
        if (value) {
            values.push(value);
        }
    });
    return values.length > 0 ? values : undefined;
};

export type GroupByClause = {
    value: FieldGroupByList;
    mode: string | undefined;
    having: LogicalExpression | undefined;
};

export const groupByClauseConvert = (
    target: GroupByClauseTypeClass,
    errorClass: ErrorTypeClass[],
): GroupByClause => {
    const valueTypeClass = toTypeClass(target.getValue(), isFieldGroupByListType, errorClass);

    const havingValue = target.getHaving();
    const havingTypeClass = havingValue
        ? toTypeClass(havingValue, isLogicalExpressionType, errorClass)
        : undefined;

    return {
        value: valueTypeClass ? fieldGroupByListConvert(valueTypeClass, errorClass) : undefined,
        mode: target.getMode() ?? undefined,
        having: havingTypeClass ? logicalExpressionConvert(havingTypeClass, errorClass) : undefined,
    };
};

export type LimitClause = string | BoundExpression;

export const limitClauseConvert = (
    target: LimitClauseTypeClass,
    errorClass: ErrorTypeClass[],
): LimitClause => {
    const value = target.getValue();
    if (typeof value === 'string') {
        return value;
    }

    const valueTypeClass = toTypeClass(value, isBoundExpressionType, errorClass);
    return valueTypeClass ? boundExpressionConvert(valueTypeClass, errorClass) : undefined;
};

export type OffsetClause = string | BoundExpression;

export const offsetClauseConvert = (
    target: OffsetClauseTypeClass,
    errorClass: ErrorTypeClass[],
): OffsetClause => {
    const value = target.getValue();
    if (typeof value === 'string') {
        return value;
    }

    const valueTypeClass = toTypeClass(value, isBoundExpressionType, errorClass);
    return valueTypeClass ? boundExpressionConvert(valueTypeClass, errorClass) : undefined;
};

export type OrderByClause = FieldOrderList;

export const orderByClauseConvert = (
    target: OrderByClauseTypeClass,
    errorClass: ErrorTypeClass[],
): OrderByClause => {
    const valueTypeClass = toTypeClass(target.getValue(), isFieldOrderListType, errorClass);
    return valueTypeClass ? fieldOrderListConvert(valueTypeClass, errorClass) : undefined;
};

export type SoslClauses = {
    value: SearchGroup | undefined;
    fieldSpecList: FieldSpecList;
    withList: SoslWithClause[] | undefined;
    limitClause: LimitClause | undefined;
    updateList: UpdateList;
};

export const soslClausesConvert = (
    target: SoslClausesTypeClass,
    errorClass: ErrorTypeClass[],
): SoslClauses => {
    const valueValue = target.getValue();
    const valueTypeClass = valueValue
        ? toTypeClass(valueValue, isSearchGroupType, errorClass)
        : undefined;

    const fieldSpecListValue = target.getFieldSpecList();
    const fieldSpecListTypeClass = fieldSpecListValue
        ? toTypeClass(fieldSpecListValue, isFieldSpecListType, errorClass)
        : undefined;

    const withList: SoslWithClause[] = [];
    target.getWithList()?.forEach((item) => {
        const withTypeClass = toTypeClass(item, isSoslWithClauseType, errorClass);
        if (withTypeClass) {
            withList.push(soslWithClauseConvert(withTypeClass, errorClass));
        }
    });

    const limitClauseValue = target.getLimitClause();
    const limitClauseTypeClass = limitClauseValue
        ? toTypeClass(limitClauseValue, isLimitClauseType, errorClass)
        : undefined;

    const updateListValue = target.getUpdateList();
    const updateListTypeClass = updateListValue
        ? toTypeClass(updateListValue, isUpdateListType, errorClass)
        : undefined;

    return {
        value: valueTypeClass ? searchGroupConvert(valueTypeClass, errorClass) : undefined,
        fieldSpecList: fieldSpecListTypeClass
            ? fieldSpecListConvert(fieldSpecListTypeClass, errorClass)
            : undefined,
        withList: withList.length > 0 ? withList : undefined,
        limitClause: limitClauseTypeClass
            ? limitClauseConvert(limitClauseTypeClass, errorClass)
            : undefined,
        updateList: updateListTypeClass
            ? updateListConvert(updateListTypeClass, errorClass)
            : undefined,
    };
};

export type SoslWithClause = {
    value: string | undefined;
    content: string | BoundExpression | FilteringExpression | NetworkList;
};

export const soslWithClauseConvert = (
    target: SoslWithClauseTypeClass,
    errorClass: ErrorTypeClass[],
): SoslWithClause => {
    const contentValue = target.getContent();

    let content: SoslWithClause['content'] = undefined;
    if (typeof contentValue === 'string') {
        content = contentValue;
    } else if (contentValue) {
        const contentTypeClass = toTypeClass(
            contentValue,
            (
                target,
            ): target is
                BoundExpressionTypeClass | FilteringExpressionTypeClass | NetworkListTypeClass =>
                isBoundExpressionType(target) ||
                isFilteringExpressionType(target) ||
                isNetworkListType(target),
            errorClass,
        );

        if (contentTypeClass) {
            if (isBoundExpressionType(contentTypeClass)) {
                content = boundExpressionConvert(contentTypeClass, errorClass);
            }
            if (isFilteringExpressionType(contentTypeClass)) {
                content = filteringExpressionConvert(contentTypeClass, errorClass);
            }
            if (isNetworkListType(contentTypeClass)) {
                content = networkListConvert(contentTypeClass, errorClass);
            }
        }
    }

    return {
        value: toPrimitiveValue(
            target.getValue(),
            (target): target is string => typeof target === 'string',
            errorClass,
        ),
        content: content,
    };
};

export type TypeOf = {
    value: FieldName;
    whenClause: WhenClause[] | undefined;
    elseClause: ElseClause;
};

export const typeOfConvert = (target: TypeOfTypeClass, errorClass: ErrorTypeClass[]): TypeOf => {
    const valueTypeClass = toTypeClass(target.getValue(), isFieldNameType, errorClass);

    const whenClause: WhenClause[] = [];
    target.getWhenClause().forEach((item) => {
        const whenTypeClass = toTypeClass(item, isWhenClauseType, errorClass);
        if (whenTypeClass) {
            whenClause.push(whenClauseConvert(whenTypeClass, errorClass));
        }
    });

    const elseClauseValue = target.getElseClause();
    const elseClauseTypeClass = elseClauseValue
        ? toTypeClass(elseClauseValue, isElseClauseType, errorClass)
        : undefined;

    return {
        value: valueTypeClass ? fieldNameConvert(valueTypeClass, errorClass) : undefined,
        whenClause: whenClause.length > 0 ? whenClause : undefined,
        elseClause: elseClauseTypeClass
            ? elseClauseConvert(elseClauseTypeClass, errorClass)
            : undefined,
    };
};

export type UpdateType = string | undefined;

export const updateTypeConvert = (
    target: UpdateTypeTypeClass,
    errorClass: ErrorTypeClass[],
): UpdateType => {
    return toPrimitiveValue(
        target.getValue(),
        (target): target is string => typeof target === 'string',
        errorClass,
    );
};

export type UsingScope = SoqlId;

export const usingScopeConvert = (
    target: UsingScopeTypeClass,
    errorClass: ErrorTypeClass[],
): UsingScope => {
    const valueTypeClass = toTypeClass(target.getValue(), isSoqlIdType, errorClass);
    return valueTypeClass ? soqlIdConvert(valueTypeClass, errorClass) : undefined;
};

export type WhenClause = {
    value: FieldName;
    field: FieldNameList;
};

export const whenClauseConvert = (
    target: WhenClauseTypeClass,
    errorClass: ErrorTypeClass[],
): WhenClause => {
    const valueTypeClass = toTypeClass(target.getValue(), isFieldNameType, errorClass);
    const fieldTypeClass = toTypeClass(target.getField(), isFieldNameListType, errorClass);

    return {
        value: valueTypeClass ? fieldNameConvert(valueTypeClass, errorClass) : undefined,
        field: fieldTypeClass ? fieldNameListConvert(fieldTypeClass, errorClass) : undefined,
    };
};

export type WhereClause = WhereLogicalExpression | undefined;

export const whereClauseConvert = (
    target: WhereClauseTypeClass,
    errorClass: ErrorTypeClass[],
): WhereClause => {
    const valueTypeClass = toTypeClass(target.getValue(), isWhereLogicalExpressionType, errorClass);
    return valueTypeClass ? whereLogicalExpressionConvert(valueTypeClass, errorClass) : undefined;
};

export type WithClause = {
    value: string | LogicalExpression | undefined;
    field: FilteringExpression;
};

export const withClauseConvert = (
    target: WithClauseTypeClass,
    errorClass: ErrorTypeClass[],
): WithClause => {
    const valueValue = target.getValue();

    let value: WithClause['value'] = undefined;
    if (typeof valueValue === 'string') {
        value = valueValue;
    } else {
        const valueTypeClass = toTypeClass(valueValue, isLogicalExpressionType, errorClass);
        value = valueTypeClass ? logicalExpressionConvert(valueTypeClass, errorClass) : undefined;
    }

    const fieldValue = target.getField();
    const fieldTypeClass = fieldValue
        ? toTypeClass(fieldValue, isFilteringExpressionType, errorClass)
        : undefined;

    return {
        value: value,
        field: fieldTypeClass ? filteringExpressionConvert(fieldTypeClass, errorClass) : undefined,
    };
};
