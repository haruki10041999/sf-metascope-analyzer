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
import { isString, isStringArray, normalIdConvert, soqlIdConvert } from './id';
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
    ExpressionClass,
    LogicalExpressionClass,
    WhereLogicalExpressionClass,
    boundExpressionConvert,
    filteringExpressionConvert,
    isExpressionClass,
    isLogicalExpressionClass,
    logicalExpressionConvert,
    whereLogicalExpressionConvert,
} from './expression';
import {
    SoqlFunctionClass,
    FieldSpecClass,
    soqlFunctionConvert,
    searchGroupConvert,
    isSoqlFunctionClass,
} from './query';

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

export const isCatchClauseClass = (target: any): target is CatchClauseClass => {
    return isCommonClass(target, CatchClauseClass);
};

export const isCatchClauseClassArray = (target: any): target is CatchClauseClass[] => {
    return Array.isArray(target) && target.every((t) => isCatchClauseClass(t));
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

    const modifiers: NormalModifierClass[] = [];
    target.getModifier().forEach((m) => {
        const typeClass = toTypeClass(m, isNormalModifierType, errorClass);
        if (typeClass) {
            modifiers.push(normalModifierConvert(typeClass, errorClass));
        }
    });
    catchClause.setModifier(modifiers);

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

export const isDataCategorySelectionClass = (target: any): target is DataCategorySelectionClass => {
    return isCommonClass(target, DataCategorySelectionClass);
};

export const isDataCategorySelectionClassArray = (
    target: any,
): target is DataCategorySelectionClass[] => {
    return Array.isArray(target) && target.every((t) => isDataCategorySelectionClass(t));
};

export const dataCategorySelectionConvert = (
    target: DataCategorySelectionTypeClass,
    errorClass: ErrorTypeClass[],
): DataCategorySelectionClass => {
    const dataCategotrSelection = new DataCategorySelectionClass();

    const categoryTypeClass = toTypeClass(target.getCategory(), isDataCategoryNameType, errorClass);
    if (categoryTypeClass) {
        dataCategotrSelection.setCategory(dataCategoryNameConvert(categoryTypeClass, errorClass));
    }

    const valueTypeClass = toTypeClass(target.getValue(), isSoqlIdType, errorClass);
    if (valueTypeClass) {
        dataCategotrSelection.setValue(soqlIdConvert(valueTypeClass, errorClass));
    }

    const selectorTypeClass = toTypeClass(
        target.getSelector(),
        isFilteringSelectorType,
        errorClass,
    );
    if (selectorTypeClass) {
        dataCategotrSelection.setSelector(filteringSelectorConvert(selectorTypeClass, errorClass));
    }

    return dataCategotrSelection;
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
): string[] | SoqlFunctionClass | null => {
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

export const isFieldGroupBy = (target: any): target is string[] | SoqlFunctionClass => {
    return isStringArray(target) && isSoqlFunctionClass(target);
};

export const isFieldGroupByArray = (target: any): target is (string[] | SoqlFunctionClass)[] => {
    return Array.isArray(target) && target.every((t) => isFieldGroupBy(t));
};

export class FieldOrderClass extends CommonClass {
    private value: string[] | SoqlFunctionClass | null = null;
    private direction: string | null = null;
    private nulls: string | null = null;

    resetValue(): void {
        if (isStringArray(this.value)) {
            this.value = [];
        }
    }

    setValue(value: string[] | SoqlFunctionClass | null): void {
        if (isStringArray(this.value) && isStringArray(value)) {
            this.value.push(...value);
        } else if (isSoqlFunctionClass(this.value) && isSoqlFunctionClass(value)) {
            this.value.copy(value);
        } else {
            this.value = value;
        }
    }

    setDirection(direction: string | null): void {
        this.direction = direction;
    }

    setNulls(nulls: string | null): void {
        this.nulls = nulls;
    }

    getValue(): string[] | SoqlFunctionClass | null {
        return this.value;
    }

    getDirection(): string | null {
        return this.direction;
    }

    getNulls(): string | null {
        return this.nulls;
    }

    copy(commonClass: FieldOrderClass): void {
        this.resetValue();
        this.setValue(commonClass.getValue());
        this.setDirection(commonClass.getDirection());
        this.setNulls(commonClass.getNulls());
    }
}

export const isFieldOrderClass = (target: any): target is FieldOrderClass => {
    return isCommonClass(target, FieldOrderClass);
};

export const isFieldOrderClassArray = (target: any): target is FieldOrderClass[] => {
    return Array.isArray(target) && target.every((t) => isFieldOrderClass(t));
};

export const fieldOrderConvert = (
    target: FieldOrderTypeClass,
    errorClass: ErrorTypeClass[],
): FieldOrderClass => {
    const fieldOrder = new FieldOrderClass();

    const valueTypeClass = toTypeClass(
        target.getValue(),
        (target): target is FieldNameTypeClass | SoqlFunctionTypeClass =>
            isFieldNameType(target) || isSoqlFunctionType(target),
        errorClass,
    );

    if (valueTypeClass) {
        if (isFieldNameType(valueTypeClass)) {
            fieldOrder.setValue(fieldNameConvert(valueTypeClass, errorClass));
        }

        if (isSoqlFunctionType(valueTypeClass)) {
            fieldOrder.setValue(soqlFunctionConvert(valueTypeClass, errorClass));
        }
    }

    fieldOrder.setDirection(target.getDirection());
    fieldOrder.setNulls(target.getNulls());

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
    private value: (string[] | SoqlFunctionClass)[] = [];
    private mode: string | null = null;
    private having: LogicalExpressionClass = new LogicalExpressionClass();

    resetValue(): void {
        this.value = [];
    }

    setValue(value: (string[] | SoqlFunctionClass)[]): void {
        this.value.push(...value);
    }

    setMode(mode: string | null): void {
        this.mode = mode;
    }

    setHaving(having: LogicalExpressionClass): void {
        this.having.copy(having);
    }

    getValue(): (string[] | SoqlFunctionClass)[] {
        return this.value;
    }

    getMode(): string | null {
        return this.mode;
    }

    getHaving(): LogicalExpressionClass {
        return this.having;
    }

    copy(commonClass: GroupByClauseClass): void {
        this.resetValue();
        this.setValue(commonClass.getValue());
        this.setMode(commonClass.getMode());
        this.setHaving(commonClass.getHaving());
    }
}

export const isGroupByClauseClass = (target: any): target is GroupByClauseClass => {
    return isCommonClass(target, GroupByClauseClass);
};

export const isGroupByClauseClassArray = (target: any): target is GroupByClauseClass[] => {
    return Array.isArray(target) && target.every((t) => isGroupByClauseClass(t));
};

export const groupByClauseConvert = (
    target: GroupByClauseTypeClass,
    errorClass: ErrorTypeClass[],
): GroupByClauseClass => {
    const groupByClause = new GroupByClauseClass();

    const valueTypeClass = toTypeClass(target.getValue(), isFieldGroupByListType, errorClass);
    if (valueTypeClass) {
        groupByClause.setValue(fieldGroupByListConvert(valueTypeClass, errorClass));
    }

    groupByClause.setMode(target.getMode());

    const havingValue = target.getHaving();
    if (havingValue) {
        const typeClass = toTypeClass(havingValue, isLogicalExpressionType, errorClass);
        if (typeClass) {
            groupByClause.setHaving(logicalExpressionConvert(typeClass, errorClass));
        }
    }

    return groupByClause;
};

export const limitClauseConvert = (
    target: LimitClauseTypeClass,
    errorClass: ErrorTypeClass[],
): string | ExpressionClass | null => {
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

export const isLimitClause = (target: any): target is string | ExpressionClass => {
    return isString(target) && isExpressionClass(target);
};

export const isLimitClauseArray = (target: any): target is (string | ExpressionClass)[] => {
    return Array.isArray(target) && target.every((t) => isLimitClause(t));
};

export const offsetClauseConvert = (
    target: OffsetClauseTypeClass,
    errorClass: ErrorTypeClass[],
): string | ExpressionClass | null => {
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

export const isOffsetClause = (target: any): target is string | ExpressionClass => {
    return isString(target) && isExpressionClass(target);
};

export const isOffsetClauseArray = (target: any): target is (string | ExpressionClass)[] => {
    return Array.isArray(target) && target.every((t) => isOffsetClause(t));
};

export const orderByClauseConvert = (
    target: OrderByClauseTypeClass,
    errorClass: ErrorTypeClass[],
): FieldOrderClass[] => {
    const value: FieldOrderClass[] = [];

    const valueTypeClass = toTypeClass(target.getValue(), isFieldOrderListType, errorClass);
    if (valueTypeClass) {
        value.push(...fieldOrderListConvert(valueTypeClass, errorClass));
    }

    return value;
};

export class SoslClausesClass extends CommonClass {
    private value: string | null = null;
    private fieldSpecList: FieldSpecClass[] = [];
    private withList: SoslWithClauseClass[] = [];
    private limitClause: string | ExpressionClass | null = null;
    private updateList: string[] = [];

    setValue(value: string | null): void {
        this.value = value;
    }

    resetFieldSpecList() {
        this.fieldSpecList = [];
    }

    setFieldSpecList(fieldSpecList: FieldSpecClass[]): void {
        this.fieldSpecList.push(...fieldSpecList);
    }

    resetWithList() {
        this.withList = [];
    }

    setWithList(withList: SoslWithClauseClass[]): void {
        this.withList.push(...withList);
    }

    setLimitClause(limitClause: string | ExpressionClass | null): void {
        if (isString(this.limitClause) && isString(limitClause)) {
            this.limitClause = limitClause;
        } else if (isExpressionClass(this.limitClause) && isExpressionClass(limitClause)) {
            this.limitClause.copy(limitClause);
        } else {
            this.limitClause = limitClause;
        }
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

    getFieldSpecList(): FieldSpecClass[] {
        return this.fieldSpecList;
    }

    getWithList(): SoslWithClauseClass[] {
        return this.withList;
    }

    getLimitClause(): string | ExpressionClass | null {
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
        this.setLimitClause(commonClass.getLimitClause());
        this.resetUpdateList();
        this.setUpdateList(commonClass.getUpdateList());
    }
}

export const isSoslClauses = (target: any): target is SoslClausesClass => {
    return isCommonClass(target, SoslClausesClass);
};

export const isSoslClausesArray = (target: any): target is SoslClausesClass[] => {
    return Array.isArray(target) && target.every((t) => isSoslClauses(t));
};

export const soslClausesConvert = (
    target: SoslClausesTypeClass,
    errorClass: ErrorTypeClass[],
): SoslClausesClass => {
    const soslClauses = new SoslClausesClass();

    const valueValue = target.getValue();
    if (valueValue) {
        const valueTypeClass = toTypeClass(valueValue, isSearchGroupType, errorClass);
        if (valueTypeClass) {
            soslClauses.setValue(searchGroupConvert(valueTypeClass, errorClass));
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
            soslClauses.setFieldSpecList(fieldSpecListConvert(fieldSpecListTypeClass, errorClass));
        }
    }

    const withClause = target.getWithList();
    const withList: SoslWithClauseClass[] = [];
    if (withClause) {
        withClause.forEach((item) => {
            const withTypeClass = toTypeClass(item, isSoslWithClauseType, errorClass);
            if (withTypeClass) {
                withList.push(soslWithClauseConvert(withTypeClass, errorClass));
            }
        });
    }
    soslClauses.setWithList(withList);

    const limitClauseValue = target.getLimitClause();
    if (limitClauseValue) {
        const limitClauseTypeClass = toTypeClass(limitClauseValue, isLimitClauseType, errorClass);
        if (limitClauseTypeClass) {
            soslClauses.setLimitClause(limitClauseConvert(limitClauseTypeClass, errorClass));
        }
    }

    const updateListValue = target.getUpdateList();
    if (updateListValue) {
        const updateListTypeClass = toTypeClass(updateListValue, isUpdateListType, errorClass);
        if (updateListTypeClass) {
            soslClauses.setUpdateList(updateListConvert(updateListTypeClass, errorClass));
        }
    }

    return soslClauses;
};

export class SoslWithClauseClass extends CommonClass {
    private value: string | null = null;
    private content: string | string[] | ExpressionClass | DataCategorySelectionClass[] | null =
        null;

    setValue(value: string | null): void {
        this.value = value;
    }

    setContent(
        content: string | string[] | ExpressionClass | DataCategorySelectionClass[] | null,
    ): void {
        if (isString(this.content) && isString(content)) {
            this.content = content;
        } else if (isStringArray(this.content) && isStringArray(content)) {
            this.content.push(...content);
        } else if (isExpressionClass(this.content) && isExpressionClass(content)) {
            this.content.copy(content);
        } else if (
            isDataCategorySelectionClassArray(this.content) &&
            isDataCategorySelectionClassArray(content)
        ) {
            this.content.push(...content);
        } else {
            this.content = content;
        }
    }

    getValue(): string | null {
        return this.value;
    }

    getContent(): string | string[] | ExpressionClass | DataCategorySelectionClass[] | null {
        return this.content;
    }

    copy(commonClass: SoslWithClauseClass): void {
        this.setValue(commonClass.getValue());
        this.setContent(commonClass.getContent());
    }
}

export const isSoslWithClauseClass = (target: any): target is SoslWithClauseClass => {
    return isCommonClass(target, SoslWithClauseClass);
};

export const isSoslWithClauseClassArray = (target: any): target is SoslWithClauseClass[] => {
    return Array.isArray(target) && target.every((t) => isSoslWithClauseClass(t));
};

export const soslWithClauseConvert = (
    target: SoslWithClauseTypeClass,
    errorClass: ErrorTypeClass[],
): SoslWithClauseClass => {
    const soslWithClause = new SoslWithClauseClass();

    soslWithClause.setValue(
        toPrimitiveValue(
            target.getValue(),
            (target): target is string => typeof target === 'string',
            errorClass,
        ),
    );

    const contentValue = target.getContent();
    if (typeof contentValue === 'string') {
        soslWithClause.setContent(contentValue);
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
                    soslWithClause.setContent(expression);
                }
            }
            if (isFilteringExpressionType(contentTypeClass)) {
                soslWithClause.setContent(filteringExpressionConvert(contentTypeClass, errorClass));
            }
            if (isNetworkListType(contentTypeClass)) {
                soslWithClause.setContent(networkListConvert(contentTypeClass, errorClass));
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

export const isTypeOfClass = (target: any): target is TypeOfClass => {
    return isCommonClass(target, TypeOfClass);
};

export const isTypeOfClassArray = (target: any): target is TypeOfClass[] => {
    return Array.isArray(target) && target.every((t) => isTypeOfClass(t));
};

export const typeOfConvert = (
    target: TypeOfTypeClass,
    errorClass: ErrorTypeClass[],
): TypeOfClass => {
    const typeOf = new TypeOfClass();

    const valueTypeClass = toTypeClass(target.getValue(), isFieldNameType, errorClass);
    if (valueTypeClass) {
        typeOf.setValue(fieldNameConvert(valueTypeClass, errorClass));
    }

    const whenClause: WhenClauseClass[] = [];
    target.getWhenClause().forEach((item) => {
        const whenTypeClass = toTypeClass(item, isWhenClauseType, errorClass);
        if (whenTypeClass) {
            whenClause.push(whenClauseConvert(whenTypeClass, errorClass));
        }
    });
    typeOf.setWhenClause(whenClause);

    const elseClauseValue = target.getElseClause();
    if (elseClauseValue) {
        const elseClauseTypeClass = toTypeClass(elseClauseValue, isElseClauseType, errorClass);
        if (elseClauseTypeClass) {
            typeOf.setElseClause(elseClauseConvert(elseClauseTypeClass, errorClass));
        }
    }

    return typeOf;
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

export const isWhenClauseClass = (target: any): target is WhenClauseClass => {
    return isCommonClass(target, WhenClauseClass);
};

export const isWhenClauseClassArray = (target: any): target is WhenClauseClass[] => {
    return Array.isArray(target) && target.every((t) => isWhenClauseClass(t));
};

export const whenClauseConvert = (
    target: WhenClauseTypeClass,
    errorClass: ErrorTypeClass[],
): WhenClauseClass => {
    const whenClause = new WhenClauseClass();

    const valueTypeClass = toTypeClass(target.getValue(), isFieldNameType, errorClass);
    if (valueTypeClass) {
        whenClause.setValue(fieldNameConvert(valueTypeClass, errorClass));
    }

    const field: string[][] = [];
    const fieldTypeClass = toTypeClass(target.getField(), isFieldNameListType, errorClass);
    if (fieldTypeClass) {
        whenClause.setField(fieldNameListConvert(fieldTypeClass, errorClass));
    }

    return whenClause;
};

export const whereClauseConvert = (
    target: WhereClauseTypeClass,
    errorClass: ErrorTypeClass[],
): WhereLogicalExpressionClass => {
    const whereClause = new WhereLogicalExpressionClass();

    const valueTypeClass = toTypeClass(target.getValue(), isWhereLogicalExpressionType, errorClass);
    if (valueTypeClass) {
        whereClause.copy(whereLogicalExpressionConvert(valueTypeClass, errorClass));
    }

    return whereClause;
};

export class WithClauseClass extends CommonClass {
    private value: string | LogicalExpressionClass | null = null;
    private field: DataCategorySelectionClass[] = [];

    setValue(value: string | LogicalExpressionClass | null): void {
        if (isString(this.value) && isString(value)) {
            this.value = value;
        } else if (isLogicalExpressionClass(this.value) && isLogicalExpressionClass(value)) {
            this.value.copy(value);
        } else {
            this.value = value;
        }
    }

    resetField(): void {
        this.field = [];
    }

    setField(field: DataCategorySelectionClass[]): void {
        this.field.push(...field);
    }

    getValue(): string | LogicalExpressionClass | null {
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

export const isWithClauseClass = (target: any): target is WithClauseClass => {
    return isCommonClass(target, WithClauseClass);
};

export const isWithClauseClassArray = (target: any): target is WhenClauseClass[] => {
    return Array.isArray(target) && target.every((t) => isWithClauseClass(t));
};

export const withClauseConvert = (
    target: WithClauseTypeClass,
    errorClass: ErrorTypeClass[],
): WithClauseClass => {
    const withClause = new WithClauseClass();

    const fieldValue = target.getField();
    if (fieldValue) {
        const fieldTypeClass = toTypeClass(fieldValue, isFilteringExpressionType, errorClass);
        if (fieldTypeClass) {
            withClause.setField(filteringExpressionConvert(fieldTypeClass, errorClass));
        }
    }

    const valueValue = target.getValue();
    if (typeof valueValue === 'string') {
        withClause.setValue(valueValue);
    } else {
        const valueTypeClass = toTypeClass(valueValue, isLogicalExpressionType, errorClass);
        if (valueTypeClass) {
            withClause.setField(logicalExpressionConvert(valueTypeClass, errorClass));
        }
    }

    return withClause;
};
