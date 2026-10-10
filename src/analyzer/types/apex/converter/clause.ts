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
    isNormalModifierType,
} from '../../apex_IR';

import { toPrimitiveValue, toTypeClass } from './commons';
import { normalIdConvert, soqlIdConvert } from './id';
import { qualifiedNameConvert, fieldNameConvert, dataCategoryNameConvert } from './name';
import { NormalStatement } from './statement';
import { normalBlockConvert } from './block';
import { NormalModifier, normalModifierConvert } from './modifier';
import {
    fieldNameListConvert,
    fieldGroupByListConvert,
    fieldOrderListConvert,
    fieldSpecListConvert,
    updateListConvert,
    networkListConvert,
} from './list';
import {
    Expression,
    boundExpressionConvert,
    filteringExpressionConvert,
    LogicalExpression,
    logicalExpressionConvert,
    WhereLogicalExpression,
    whereLogicalExpressionConvert,
} from './expression';
import { SoqlFunction, soqlFunctionConvert, searchGroupConvert, FieldSpec } from './query';

export const allRowsClauseConvert = (
    target: AllRowsClauseTypeClass,
    errorClass: ErrorTypeClass[],
): string | undefined => {
    return toPrimitiveValue(
        target.getValue(),
        (target): target is string => typeof target === 'string',
        errorClass,
    );
};

export type CatchClause = {
    value?: string;
    valueType: string[];
    block: NormalStatement[];
    modifier: NormalModifier[];
};

export const catchClauseConvert = (
    target: CatchClauseTypeClass,
    errorClass: ErrorTypeClass[],
): CatchClause => {
    const catchClause: CatchClause = {
        valueType: [],
        block: [],
        modifier: [],
    };

    const valueTypeClass = toTypeClass(target.getValue(), isNormalIdType, errorClass);
    if (valueTypeClass) {
        catchClause.value = normalIdConvert(valueTypeClass);
    }

    const valueTypeTypeClass = toTypeClass(target.getValueType(), isQualifiedNameType, errorClass);
    if (valueTypeTypeClass) {
        catchClause.valueType.push(...qualifiedNameConvert(valueTypeTypeClass, errorClass));
    }

    const blockTypeClass = toTypeClass(target.getBlock(), isNormalBlockType, errorClass);
    if (blockTypeClass) {
        catchClause.block.push(...normalBlockConvert(blockTypeClass, errorClass));
    }

    target.getModifier().forEach((m) => {
        const typeClass = toTypeClass(m, isNormalModifierType, errorClass);
        if (typeClass) {
            const modifier = normalModifierConvert(typeClass, errorClass);
            if (modifier) {
                catchClause.modifier.push(modifier);
            }
        }
    });

    return catchClause;
};

export type DataCategorySelection = {
    value?: string;
    selector?: string;
    category: string[];
};

export const dataCategorySelectionConvert = (
    target: DataCategorySelectionTypeClass,
    errorClass: ErrorTypeClass[],
): DataCategorySelection => {
    const category: string[] = [];
    const categoryTypeClass = toTypeClass(target.getCategory(), isDataCategoryNameType, errorClass);
    if (categoryTypeClass) {
        category.push(...dataCategoryNameConvert(categoryTypeClass, errorClass));
    }

    const dataCategorySelection: DataCategorySelection = {
        category: category,
    };

    const valueTypeClass = toTypeClass(target.getValue(), isSoqlIdType, errorClass);
    if (valueTypeClass) {
        const soqlId = soqlIdConvert(valueTypeClass, errorClass);
        if (soqlId) {
            dataCategorySelection.value = soqlId;
        }
    }

    const selectorTypeClass = toTypeClass(
        target.getSelector(),
        isFilteringSelectorType,
        errorClass,
    );
    if (selectorTypeClass) {
        const selector = filteringSelectorConvert(selectorTypeClass, errorClass);
        if (selector) {
            dataCategorySelection.selector = selector;
        }
    }

    return dataCategorySelection;
};

export const elseClauseConvert = (
    target: ElseClauseTypeClass,
    errorClass: ErrorTypeClass[],
): string[][] => {
    const valueTypeClass = toTypeClass(target.getValue(), isFieldNameListType, errorClass);
    if (valueTypeClass) {
        return fieldNameListConvert(valueTypeClass, errorClass);
    }

    return [];
};

export const fieldGroupByConvert = (
    target: FieldGroupByTypeClass,
    errorClass: ErrorTypeClass[],
): string[] | SoqlFunction | undefined => {
    const valueTypeClass = toTypeClass(
        target.getValue(),
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

export type FieldOrder = {
    value?: string[] | SoqlFunction;
    direction?: string;
    nulls?: string;
};

export const fieldOrderConvert = (
    target: FieldOrderTypeClass,
    errorClass: ErrorTypeClass[],
): FieldOrder => {
    const fieldOrder: FieldOrder = {};

    const valueTypeClass = toTypeClass(
        target.getValue(),
        (target): target is FieldNameTypeClass | SoqlFunctionTypeClass =>
            isFieldNameType(target) || isSoqlFunctionType(target),
        errorClass,
    );

    if (valueTypeClass) {
        if (isFieldNameType(valueTypeClass)) {
            fieldOrder.value = fieldNameConvert(valueTypeClass, errorClass);
        }

        if (isSoqlFunctionType(valueTypeClass)) {
            fieldOrder.value = soqlFunctionConvert(valueTypeClass, errorClass);
        }
    }

    const direction = target.getDirection();
    if (direction) {
        fieldOrder.direction = direction;
    }

    const nulls = target.getNulls();
    if (nulls) {
        fieldOrder.nulls = nulls;
    }

    return fieldOrder;
};

export const filteringSelectorConvert = (
    target: FilteringSelectorTypeClass,
    errorClass: ErrorTypeClass[],
): string | undefined => {
    return toPrimitiveValue(
        target.getValue(),
        (target): target is string => typeof target === 'string',
        errorClass,
    );
};

export const forClausesConvert = (
    target: ForClausesTypeClass,
    errorClass: ErrorTypeClass[],
): string[] => {
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
    return values;
};

export type GroupByClause = {
    value: (string[] | SoqlFunction)[];
    mode?: string;
    having: LogicalExpression;
};

export const groupByClauseConvert = (
    target: GroupByClauseTypeClass,
    errorClass: ErrorTypeClass[],
): GroupByClause => {
    const groupByClause: GroupByClause = {
        value: [],
        having: {
            value: [],
        },
    };

    const valueTypeClass = toTypeClass(target.getValue(), isFieldGroupByListType, errorClass);
    if (valueTypeClass) {
        groupByClause.value.push(...fieldGroupByListConvert(valueTypeClass, errorClass));
    }

    const mode = target.getMode();
    if (mode) {
        groupByClause.mode = mode;
    }

    const havingValue = target.getHaving();
    if (havingValue) {
        const typeClass = toTypeClass(havingValue, isLogicalExpressionType, errorClass);
        if (typeClass) {
            const expression = logicalExpressionConvert(typeClass, errorClass);
            groupByClause.having.value.push(...expression.value);
            if (expression.operator) {
                groupByClause.having.operator = expression.operator;
            }
        }
    }

    return groupByClause;
};

export const limitClauseConvert = (
    target: LimitClauseTypeClass,
    errorClass: ErrorTypeClass[],
): string | Expression | undefined => {
    const value = target.getValue();
    if (typeof value === 'string') {
        return value;
    }

    const valueTypeClass = toTypeClass(value, isBoundExpressionType, errorClass);
    if (valueTypeClass) {
        return boundExpressionConvert(valueTypeClass, errorClass);
    }

    return undefined;
};

export const offsetClauseConvert = (
    target: OffsetClauseTypeClass,
    errorClass: ErrorTypeClass[],
): string | Expression | undefined => {
    const value = target.getValue();
    if (typeof value === 'string') {
        return value;
    }

    const valueTypeClass = toTypeClass(value, isBoundExpressionType, errorClass);
    if (valueTypeClass) {
        return boundExpressionConvert(valueTypeClass, errorClass);
    }

    return undefined;
};

export const orderByClauseConvert = (
    target: OrderByClauseTypeClass,
    errorClass: ErrorTypeClass[],
): FieldOrder[] => {
    const valueTypeClass = toTypeClass(target.getValue(), isFieldOrderListType, errorClass);
    if (valueTypeClass) {
        return fieldOrderListConvert(valueTypeClass, errorClass);
    }

    return [];
};

export type SoslClauses = {
    value?: string;
    fieldSpecList: FieldSpec[];
    withList: SoslWithClause[];
    limitClause?: string | Expression;
    updateList: string[];
};

export const soslClausesConvert = (
    target: SoslClausesTypeClass,
    errorClass: ErrorTypeClass[],
): SoslClauses => {
    const soslClauses: SoslClauses = {
        fieldSpecList: [],
        withList: [],
        updateList: [],
    };

    const valueValue = target.getValue();
    if (valueValue) {
        const valueTypeClass = toTypeClass(valueValue, isSearchGroupType, errorClass);
        if (valueTypeClass) {
            const searchGroup = searchGroupConvert(valueTypeClass, errorClass);
            if (searchGroup) {
                soslClauses.value = searchGroup;
            }
        }
    }

    const fieldSpecListValue = target.getFieldSpecList();
    if (fieldSpecListValue) {
        const fieldSpecListTypeClass = toTypeClass(
            fieldSpecListValue,
            isFieldSpecListType,
            errorClass,
        );
        if (fieldSpecListTypeClass) {
            soslClauses.fieldSpecList.push(
                ...fieldSpecListConvert(fieldSpecListTypeClass, errorClass),
            );
        }
    }

    target.getWithList()?.forEach((item) => {
        const withTypeClass = toTypeClass(item, isSoslWithClauseType, errorClass);
        if (withTypeClass) {
            soslClauses.withList.push(soslWithClauseConvert(withTypeClass, errorClass));
        }
    });

    const limitClauseValue = target.getLimitClause();
    if (limitClauseValue) {
        const limitClauseTypeClass = toTypeClass(limitClauseValue, isLimitClauseType, errorClass);
        if (limitClauseTypeClass) {
            const limitClause = limitClauseConvert(limitClauseTypeClass, errorClass);
            if (limitClause) {
                soslClauses.limitClause = limitClause;
            }
        }
    }

    const updateListValue = target.getUpdateList();
    if (updateListValue) {
        const updateListTypeClass = toTypeClass(updateListValue, isUpdateListType, errorClass);
        if (updateListTypeClass) {
            soslClauses.updateList.push(...updateListConvert(updateListTypeClass, errorClass));
        }
    }

    return soslClauses;
};

export type SoslWithClause = {
    value?: string;
    content?: string | string[] | Expression | DataCategorySelection[];
};

export const soslWithClauseConvert = (
    target: SoslWithClauseTypeClass,
    errorClass: ErrorTypeClass[],
): SoslWithClause => {
    const soslWithClause: SoslWithClause = {};

    const value = toPrimitiveValue(
        target.getValue(),
        (target): target is string => typeof target === 'string',
        errorClass,
    );
    if (value) {
        soslWithClause.value = value;
    }

    const contentValue = target.getContent();
    if (typeof contentValue === 'string') {
        soslWithClause.content = contentValue;
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
                const expression = boundExpressionConvert(contentTypeClass, errorClass);
                if (expression) {
                    soslWithClause.content = expression;
                }
            }
            if (isFilteringExpressionType(contentTypeClass)) {
                soslWithClause.content = filteringExpressionConvert(contentTypeClass, errorClass);
            }
            if (isNetworkListType(contentTypeClass)) {
                soslWithClause.content = networkListConvert(contentTypeClass, errorClass);
            }
        }
    }

    return soslWithClause;
};

export type TypeOf = {
    value: string[];
    whenClause: WhenClause[];
    elseClause: string[][];
};

export const typeOfConvert = (target: TypeOfTypeClass, errorClass: ErrorTypeClass[]): TypeOf => {
    const value: string[] = [];
    const valueTypeClass = toTypeClass(target.getValue(), isFieldNameType, errorClass);
    if (valueTypeClass) {
        value.push(...fieldNameConvert(valueTypeClass, errorClass));
    }

    const whenClause: WhenClause[] = [];
    target.getWhenClause().forEach((item) => {
        const whenTypeClass = toTypeClass(item, isWhenClauseType, errorClass);
        if (whenTypeClass) {
            whenClause.push(whenClauseConvert(whenTypeClass, errorClass));
        }
    });

    const elseClause: string[][] = [];
    const elseClauseValue = target.getElseClause();
    if (elseClauseValue) {
        const elseClauseTypeClass = toTypeClass(elseClauseValue, isElseClauseType, errorClass);
        if (elseClauseTypeClass) {
            elseClause.push(...elseClauseConvert(elseClauseTypeClass, errorClass));
        }
    }

    return {
        value: value,
        whenClause: whenClause,
        elseClause: elseClause,
    };
};

export const updateTypeConvert = (
    target: UpdateTypeTypeClass,
    errorClass: ErrorTypeClass[],
): string | undefined => {
    return toPrimitiveValue(
        target.getValue(),
        (target): target is string => typeof target === 'string',
        errorClass,
    );
};

export const usingScopeConvert = (
    target: UsingScopeTypeClass,
    errorClass: ErrorTypeClass[],
): string | undefined => {
    const valueTypeClass = toTypeClass(target.getValue(), isSoqlIdType, errorClass);
    if (valueTypeClass) {
        return soqlIdConvert(valueTypeClass, errorClass);
    }

    return undefined;
};

export type WhenClause = {
    value: string[];
    field: string[][];
};

export const whenClauseConvert = (
    target: WhenClauseTypeClass,
    errorClass: ErrorTypeClass[],
): WhenClause => {
    const value: string[] = [];
    const valueTypeClass = toTypeClass(target.getValue(), isFieldNameType, errorClass);
    if (valueTypeClass) {
        value.push(...fieldNameConvert(valueTypeClass, errorClass));
    }

    const field: string[][] = [];
    const fieldTypeClass = toTypeClass(target.getField(), isFieldNameListType, errorClass);
    if (fieldTypeClass) {
        field.push(...fieldNameListConvert(fieldTypeClass, errorClass));
    }
    return {
        value: value,
        field: field,
    };
};

export const whereClauseConvert = (
    target: WhereClauseTypeClass,
    errorClass: ErrorTypeClass[],
): WhereLogicalExpression => {
    const valueTypeClass = toTypeClass(target.getValue(), isWhereLogicalExpressionType, errorClass);
    if (valueTypeClass) {
        return whereLogicalExpressionConvert(valueTypeClass, errorClass);
    }

    return {
        value: [],
    };
};

export type WithClause = {
    value?: string | LogicalExpression;
    field: DataCategorySelection[];
};

export const withClauseConvert = (
    target: WithClauseTypeClass,
    errorClass: ErrorTypeClass[],
): WithClause => {
    const field: DataCategorySelection[] = [];
    const fieldValue = target.getField();
    if (fieldValue) {
        const fieldTypeClass = toTypeClass(fieldValue, isFilteringExpressionType, errorClass);
        if (fieldTypeClass) {
            field.push(...filteringExpressionConvert(fieldTypeClass, errorClass));
        }
    }

    const withClause: WithClause = {
        field: field,
    };

    const valueValue = target.getValue();
    if (typeof valueValue === 'string') {
        withClause.value = valueValue;
    } else {
        const valueTypeClass = toTypeClass(valueValue, isLogicalExpressionType, errorClass);
        if (valueTypeClass) {
            const expression = logicalExpressionConvert(valueTypeClass, errorClass);
            if (expression) {
                withClause.value = expression;
            }
        }
    }

    return withClause;
};
