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

import { toPrimitiveValue, toTypeClass, CommonClass, isCommonClass } from './commons';
import { normalIdConvert, soqlIdConvert } from './id';
import { qualifiedNameConvert, fieldNameConvert, dataCategoryNameConvert } from './name';
import { NormalStatementClass } from './statement';
import { normalBlockConvert } from './block';
import { NormalModifierClass, normalModifierConvert } from './modifier';
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
): string | null => {
    return toPrimitiveValue(
        target.getValue(),
        (target): target is string => typeof target === 'string',
        errorClass,
    );
};

export class CatchClauseClass extends CommonClass {
    private value: string | null = null;
    private valueType: string[] = [];
    private block: NormalStatementClass[] = [];
    private modifier: NormalModifierClass[] = [];

    setValue(value: string | null): void {
        this.value = value;
    }

    resetvalueType(): void {
        this.valueType = [];
    }

    setvalueType(valueType: string[]): void {
        this.valueType.push(...valueType);
    }

    resetBlock(): void {
        this.block = [];
    }

    setBlock(block: NormalStatementClass[]): void {
        this.block.push(...block);
    }

    resetModifier(): void {
        this.modifier = [];
    }

    setModifier(modifier: NormalModifierClass[]): void {
        this.modifier.push(...modifier);
    }

    getValue(): string | null {
        return this.value;
    }

    getValueType(): string[] {
        return this.valueType;
    }

    getBlock(): NormalStatementClass[] {
        return this.block;
    }

    getModifier(): NormalModifierClass[] {
        return this.modifier;
    }

    copy(commonClass: CatchClauseClass): void {
        this.setValue(commonClass.getValue());
        this.resetvalueType();
        this.setvalueType(commonClass.getValueType());
        this.resetBlock();
        this.setBlock(commonClass.getBlock());
        this.resetModifier();
        this.setModifier(commonClass.getModifier());
    }
}

export const isCatchClauseClass = (target: CommonClass): target is CatchClauseClass => {
    return isCommonClass(target, CatchClauseClass);
};

export const catchClauseConvert = (
    target: CatchClauseTypeClass,
    errorClass: ErrorTypeClass[],
): CatchClauseClass => {
    const catchClause = new CatchClauseClass();

    const valueTypeClass = toTypeClass(target.getValue(), isNormalIdType, errorClass);
    if (valueTypeClass) {
        catchClause.setValue(normalIdConvert(valueTypeClass));
    }

    const valueType: string[] = [];
    const valueTypeTypeClass = toTypeClass(target.getValueType(), isQualifiedNameType, errorClass);
    if (valueTypeTypeClass) {
        valueType.push(...qualifiedNameConvert(valueTypeTypeClass, errorClass));
    }
    catchClause.setvalueType(valueType);

    const block: NormalStatementClass[] = [];
    const blockTypeClass = toTypeClass(target.getBlock(), isNormalBlockType, errorClass);
    if (blockTypeClass) {
        block.push(...normalBlockConvert(blockTypeClass, errorClass));
    }
    catchClause.setBlock(block);

    const modifier: NormalModifierClass[] = [];
    target.getModifier().forEach((m) => {
        const typeClass = toTypeClass(m, isNormalModifierType, errorClass);
        if (typeClass) {
            const modifier = normalModifierConvert(typeClass, errorClass);
            if (modifier) {
                modifier.push(modifier);
            }
        }
    });
    catchClause.setModifier(modifier);

    return catchClause;
};

export class DataCategorySelectionClass extends CommonClass {
    private value: string | null = null;
    private selector: string | null = null;
    private category: string[] = [];

    setValue(value: string | null): void {
        this.value = value;
    }

    setSelector(selector: string | null): void {
        this.selector = selector;
    }

    resetCategory(): void {
        this.category = [];
    }

    setCategory(category: string[]): void {
        this.category.push(...category);
    }

    getValue(): string | null {
        return this.value;
    }

    getSelector(): string | null {
        return this.selector;
    }

    getCategory(): string[] {
        return this.category;
    }

    copy(commonClass: DataCategorySelectionClass): void {
        this.setValue(commonClass.getValue());
        this.setSelector(commonClass.getSelector());
        this.resetCategory();
        this.setCategory(commonClass.getCategory());
    }
}

export const isDataCategorySelectionClass = (
    target: CommonClass,
): target is DataCategorySelectionClass => {
    return isCommonClass(target, DataCategorySelectionClass);
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
): string[] | SoqlFunction | null => {
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

    return null;
};

export class FieldOrderClass extends CommonClass {
    private value: string[] | SoqlFunction = null;
    private direction: string | null = null;
    private nulls: string | null = null;

    setValue(value: string | null): void {
        this.value = value;
    }

    setDirection(direction: string | null): void {
        this.direction = direction;
    }

    setNulls(nulls: string | null): void {
        this.nulls = nulls;
    }

    getValue(): string | null {
        return this.value;
    }

    getDirection(): string | null {
        return this.direction;
    }

    getNulls(): string | null {
        return this.nulls;
    }

    copy(commonClass: FieldOrderClass): void {
        this.setValue(commonClass.getValue());
        this.setDirection(commonClass.getDirection());
        this.setNulls(commonClass.getNulls());
    }
}

export const isFieldOrderClass = (target: CommonClass): target is FieldOrderClass => {
    return isCommonClass(target, FieldOrderClass);
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
): string | null => {
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

export class GroupByClauseClass extends CommonClass {
    private value: (string[] | SoqlFunction)[] = [];
    private mode: string | null = null;
    private having: LogicalExpression | null = [];

    resetValue(): void {
        this.value = [];
    }

    setValue(value: (string[] | SoqlFunction)[]): void {
        this.value.push(...value);
    }

    setMode(mode: string | null): void {
        this.mode = mode;
    }

    setHaving(having: LogicalExpression | null): void {
        this.having = having;
    }

    getValue(): (string[] | SoqlFunction)[] {
        return this.value;
    }

    getMode(): string | null {
        return this.mode;
    }

    getHaving(): LogicalExpression | null {
        return this.having;
    }

    copy(commonClass: GroupByClauseClass): void {
        this.resetValue();
        this.setValue(commonClass.getValue());
        this.setMode(commonClass.getMode());
        this.setHaving(commonClass.getHaving());
    }
}

export const isGroupByClauseClass = (target: CommonClass): target is GroupByClauseClass => {
    return isCommonClass(target, GroupByClauseClass);
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
): string | Expression | null => {
    const value = target.getValue();
    if (typeof value === 'string') {
        return value;
    }

    const valueTypeClass = toTypeClass(value, isBoundExpressionType, errorClass);
    if (valueTypeClass) {
        return boundExpressionConvert(valueTypeClass, errorClass);
    }

    return null;
};

export const offsetClauseConvert = (
    target: OffsetClauseTypeClass,
    errorClass: ErrorTypeClass[],
): string | Expression | null => {
    const value = target.getValue();
    if (typeof value === 'string') {
        return value;
    }

    const valueTypeClass = toTypeClass(value, isBoundExpressionType, errorClass);
    if (valueTypeClass) {
        return boundExpressionConvert(valueTypeClass, errorClass);
    }

    return null;
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

export class SoslClausesClass extends CommonClass {
    private value: string | null = null;
    private fieldSpecList: FieldSpec[] = [];
    private withList: SoslWithClauseClass[] = [];
    private limitClause: string | Expression | null = null;
    private updateList: string[] = [];

    setValue(value: string | null): void {
        this.value = value;
    }

    resetFieldSpecList() {
        this.fieldSpecList = [];
    }

    setFieldSpecList(fieldSpecList: FieldSpec[]): void {
        this.fieldSpecList = fieldSpecList;
    }

    resetWithList() {
        this.withList = [];
    }

    setWithList(withList: SoslWithClauseClass[]): void {
        this.withList = withList;
    }

    setLimitClause(limitClause: string | Expression | null): void {
        this.limitClause = limitClause;
    }

    resetUpdateList() {
        this.updateList = [];
    }

    setUpdateList(updateList: string[]): void {
        this.updateList.push(...updateList);
    }

    getValue(): string | null {
        return this.value;
    }

    getFieldSpecList(): FieldSpec[] {
        return this.fieldSpecList;
    }

    getWithList(): SoslWithClauseClass[] {
        return this.withList;
    }

    getLimitClause(): string | Expression | null {
        return this.limitClause;
    }

    getUpdateList(): string[] {
        return this.updateList;
    }

    copy(commonClass: SoslClausesClass): void {
        this.setValue(commonClass.getValue());
        this.resetFieldSpecList();
        this.setFieldSpecList(commonClass.getFieldSpecList());
        this.resetWithList();
        this.setWithList(commonClass.getWithList());
        this.limitClause(commonClass.limitClause());
        this.resetUpdateList();
        this.setUpdateList(commonClass.getUpdateList());
    }
}

export const isSoslClauses = (target: CommonClass): target is SoslClausesClass => {
    return isCommonClass(target, SoslClausesClass);
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

export class SoslWithClauseClass extends CommonClass {
    private value: string | null = null;
    private content: string | string[] | Expression | DataCategorySelectionClass[] | null = null;

    setValue(value: string | null): void {
        this.value = value;
    }

    setContent(
        content: string | string[] | Expression | DataCategorySelectionClass[] | null,
    ): void {
        this.content = content;
    }

    getValue(): string | null {
        return this.value;
    }

    getContent(): string | string[] | Expression | DataCategorySelectionClass[] | null {
        return this.content;
    }

    copy(commonClass: SoslWithClauseClass): void {
        this.setValue(commonClass.getValue());
        this.setContent(commonClass.content());
    }
}

export const isSoslWithClauseClass = (target: CommonClass): target is SoslWithClauseClass => {
    return isCommonClass(target, SoslWithClauseClass);
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

export class TypeOfClass extends CommonClass {
    private value: string[] = [];
    private whenClause: WhenClauseClass[] = [];
    private elseClause: string[][] = [];

    resetValue(): void {
        this.value = [];
    }

    setValue(value: string[]): void {
        this.value.push(...value);
    }

    resetWhenClause(): void {
        this.whenClause = [];
    }

    setWhenClause(whenClause: WhenClauseClass[]): void {
        this.whenClause = whenClause;
    }

    resetElseClause(): void {
        this.elseClause = [];
    }

    setElseClause(elseClause: string[][]): void {
        this.elseClause.push(...elseClause);
    }

    getValue(): string[] {
        return this.value;
    }

    getWhenClause(): WhenClauseClass[] {
        return this.whenClause;
    }

    getElseClause(): string[][] {
        return this.elseClause;
    }

    copy(commonClass: TypeOfClass): void {
        this.resetValue();
        this.setValue(commonClass.getValue());
        this.resetWhenClause();
        this.setWhenClause(commonClass.getWhenClause());
        this.resetElseClause();
        this.setElseClause(commonClass.getElseClause());
    }
}

export const isTypeOfClass = (target: CommonClass): target is TypeOfClass => {
    return isCommonClass(target, TypeOfClass);
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
): string | null => {
    return toPrimitiveValue(
        target.getValue(),
        (target): target is string => typeof target === 'string',
        errorClass,
    );
};

export const usingScopeConvert = (
    target: UsingScopeTypeClass,
    errorClass: ErrorTypeClass[],
): string | null => {
    const valueTypeClass = toTypeClass(target.getValue(), isSoqlIdType, errorClass);
    if (valueTypeClass) {
        return soqlIdConvert(valueTypeClass, errorClass);
    }

    return null;
};

export class WhenClauseClass extends CommonClass {
    private value: string[] = [];
    private field: string[][] = [];

    resetValue(): void {
        this.value = [];
    }

    setValue(value: string[]): void {
        this.value.push(...value);
    }

    resetField(): void {
        this.field = [];
    }

    setField(field: string[][]): void {
        this.field.push(...field);
    }

    getValue(): string[] {
        return this.value;
    }

    getField(): string[][] {
        return this.field;
    }

    copy(commonClass: WhenClauseClass): void {
        this.resetValue();
        this.setValue(commonClass.getValue());
        this.resetField();
        this.setField(commonClass.getField());
    }
}

export const isWhenClauseClass = (target: CommonClass): target is WhenClauseClass => {
    return isCommonClass(target, WhenClauseClass);
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

export class WithClauseClass extends CommonClass {
    private value: string | LogicalExpression | null = null;
    private field: DataCategorySelectionClass[] = [];

    setValue(value: string | LogicalExpression | null): void {
        this.value = value;
    }

    resetField(): void {
        this.field = [];
    }

    setField(field: DataCategorySelectionClass[]): void {
        this.field.push(...field);
    }

    getValue(): string | LogicalExpression | null {
        return this.value;
    }

    getField(): DataCategorySelectionClass[] {
        return this.field;
    }

    copy(commonClass: WithClauseClass): void {
        this.setValue(commonClass.getValue());
        this.resetField();
        this.setField(commonClass.getField());
    }
}

export const isWithClauseClass = (target: CommonClass): target is WithClauseClass => {
    return isCommonClass(target, WithClauseClass);
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
