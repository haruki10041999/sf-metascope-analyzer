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

import {
    toPrimitiveValue,
    toTypeClass,
    CommonClass,
    isCommonClass,
    isStringArray,
    isDistanceValueArray,
    isString,
} from './commons';
import { soslIdConvert } from './id';
import {
    DateFieldNameClass,
    fieldNameConvert,
    dateFieldNameConvert,
    isDateFieldNameClass,
} from './name';
import {
    FromNameClass,
    SoslFieldClass,
    fieldListConvert,
    fieldOrderListConvert,
    fromNameListConvert,
    selectListConvert,
    subFieldListConvert,
    updateListConvert,
} from './list';
import {
    ExpressionClass,
    LogicalExpressionClass,
    WhereLogicalExpressionClass,
    isExpressionClass,
    logicalExpressionConvert,
} from './expression';
import { SignedLiteralClass, signedIntegerConvert } from './literal';
import { locationValueConvert } from './value';
import { soqlFieldsParameterConvert } from './parameter';
import {
    FieldOrderClass,
    GroupByClauseClass,
    WithClauseClass,
    allRowsClauseConvert,
    forClausesConvert,
    groupByClauseConvert,
    limitClauseConvert,
    offsetClauseConvert,
    orderByClauseConvert,
    usingScopeConvert,
    whereClauseConvert,
    withClauseConvert,
} from './clause';
import { EntryClass } from './entry';

export const comparisonOperatorConvert = (
    target: ComparisonOperatorTypeClass,
    errorClass: ErrorTypeClass[],
): string | null => {
    return toPrimitiveValue(
        target.getValue(),
        (target): target is string => typeof target === 'string',
        errorClass,
    );
};

export class DateFormulaClass extends CommonClass {
    private value: string | null = null;
    private param: SignedLiteralClass = new SignedLiteralClass();

    setValue(value: string | null) {
        this.value = value;
    }

    setParam(param: SignedLiteralClass) {
        this.param.copy(param);
    }

    getValue(): string | null {
        return this.value;
    }

    getParam(): SignedLiteralClass {
        return this.param;
    }

    copy(commonClass: DateFormulaClass): void {
        this.setValue(commonClass.getValue());
        this.setParam(commonClass.getParam());
    }
}

export const isDateFormulaClass = (target: CommonClass): target is DateFormulaClass => {
    return target instanceof DateFormulaClass;
};

export const dateFormulaConvert = (
    target: DateFormulaTypeClass,
    errorClass: ErrorTypeClass[],
): DateFormulaClass => {
    const dateFormula = new DateFormulaClass();

    dateFormula.setValue(
        toPrimitiveValue(
            target.getValue(),
            (target): target is string => typeof target === 'string',
            errorClass,
        ),
    );

    const paramValue = target.getParam();
    if (paramValue) {
        const typeClass = toTypeClass(paramValue, isSignedIntegerType, errorClass);
        if (typeClass) {
            dateFormula.setParam(signedIntegerConvert(typeClass, errorClass));
        }
    }

    return dateFormula;
};

export class FieldSpecClass extends CommonClass {
    private value: string[] = [];
    private fieldList: SoslFieldClass[] = [];
    private where: LogicalExpressionClass = new LogicalExpressionClass();
    private listView: string[] = [];
    private orderBy: FieldOrderClass[] = [];
    private limitClause: string | ExpressionClass | null = null;
    private offsetClause: ExpressionClass = new ExpressionClass();

    resetValue(): void {
        this.value = [];
    }

    setValue(value: string[]): void {
        this.value.push(...value);
    }

    resetFieldList(): void {
        this.fieldList = [];
    }

    setFieldList(fieldList: SoslFieldClass[]): void {
        this.fieldList.push(...fieldList);
    }

    setWhere(where: LogicalExpressionClass): void {
        this.where.copy(where);
    }

    resetListView(): void {
        this.listView = [];
    }

    setListView(listView: string[]): void {
        this.listView.push(...listView);
    }

    resetOrderBy(): void {
        this.orderBy = [];
    }

    setOrderBy(orderBy: FieldOrderClass[]) {
        this.orderBy.push(...orderBy);
    }

    setLimitClause(limitClause: string | ExpressionClass | null) {
        if (
            this.limitClause instanceof CommonClass &&
            isExpressionClass(this.limitClause) &&
            limitClause instanceof CommonClass &&
            isExpressionClass(limitClause)
        ) {
            this.limitClause.copy(limitClause);
        } else {
            this.limitClause = limitClause;
        }
    }

    setOffsetClause(offsetClause: ExpressionClass) {
        this.offsetClause.copy(offsetClause);
    }

    getValue(): string[] {
        return this.value;
    }

    getFieldList(): SoslFieldClass[] {
        return this.fieldList;
    }

    getWhere(): LogicalExpressionClass {
        return this.where;
    }

    getListView(): string[] {
        return this.listView;
    }

    getOrderBy(): FieldOrderClass[] {
        return this.orderBy;
    }

    getLimitClause(): string | ExpressionClass | null {
        return this.limitClause;
    }

    getOffsetClause(): ExpressionClass {
        return this.offsetClause;
    }

    copy(commonClass: FieldSpecClass): void {
        this.resetValue();
        this.setValue(commonClass.getValue());
        this.resetFieldList();
        this.setFieldList(commonClass.getFieldList());
        this.setWhere(commonClass.getWhere());
        this.resetListView();
        this.setListView(commonClass.getListView());
        this.resetOrderBy();
        this.setOrderBy(commonClass.getOrderBy());
        this.setLimitClause(commonClass.getLimitClause());
        this.setOffsetClause(commonClass.getOffsetClause());
    }
}

export const isFieldSpecClass = (target: CommonClass): target is FieldSpecClass => {
    return target instanceof FieldSpecClass;
};

export const fieldSpecConvert = (
    target: FieldSpecTypeClass,
    errorClass: ErrorTypeClass[],
): FieldSpecClass => {
    const fieldSpec = new FieldSpecClass();

    const valueTypeClass = toTypeClass(target.getValue(), isSoslIdType, errorClass);
    if (valueTypeClass) {
        fieldSpec.setValue(soslIdConvert(valueTypeClass, errorClass));
    }

    const fieldListValue = target.getFieldList();
    if (fieldListValue) {
        const fieldListTypeClass = toTypeClass(fieldListValue, isFieldListType, errorClass);
        if (fieldListTypeClass) {
            fieldSpec.setFieldList(fieldListConvert(fieldListTypeClass, errorClass));
        }
    }

    const listViewValue = target.getListView();
    if (listViewValue) {
        const listViewValueTypeClass = toTypeClass(listViewValue, isSoslIdType, errorClass);
        if (listViewValueTypeClass) {
            fieldSpec.setListView(soslIdConvert(listViewValueTypeClass, errorClass));
        }
    }

    const orderByValue = target.getOrderBy();
    if (orderByValue) {
        const orderByTypeClass = toTypeClass(orderByValue, isFieldOrderListType, errorClass);
        if (orderByTypeClass) {
            fieldSpec.setOrderBy(fieldOrderListConvert(orderByTypeClass, errorClass));
        }
    }

    const whereValue = target.getWhere();
    if (whereValue) {
        const whereTypeClass = toTypeClass(whereValue, isLogicalExpressionType, errorClass);
        if (whereTypeClass) {
            fieldSpec.setWhere(logicalExpressionConvert(whereTypeClass, errorClass));
        }
    }

    const limitClauseValue = target.getLimitClause();
    if (limitClauseValue) {
        const limitClauseTypeClass = toTypeClass(limitClauseValue, isLimitClauseType, errorClass);
        if (limitClauseTypeClass) {
            fieldSpec.setLimitClause(limitClauseConvert(limitClauseTypeClass, errorClass));
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
            fieldSpec.setOffsetClause(offsetClauseConvert(offsetClauseTypeClass, errorClass));
        }
    }

    return fieldSpec;
};

export class NormalQueryClass extends CommonClass {
    private value: EntryClass[] = [];
    private from: FromNameClass[] = [];
    private forClause: string[] = [];
    private whereClause: WhereLogicalExpressionClass = new WhereLogicalExpressionClass();
    private orderByClause: FieldOrderClass[] = [];
    private limitClause: string | ExpressionClass | null = null;
    private updateList: string[] = [];
    private usingScope: string | null = null;
    private withClause: WithClauseClass = new WithClauseClass();
    private groupByClause: GroupByClauseClass = new GroupByClauseClass();
    private offsetClause: string | ExpressionClass | null = null;
    private allRowsClause: string | null = null;

    resetValue(): void {
        this.value = [];
    }

    setValue(value: EntryClass[]): void {
        this.value.push(...value);
    }

    resetFrom(): void {
        this.from = [];
    }

    setFrom(from: FromNameClass[]): void {
        this.from.push(...from);
    }

    resetForClause(): void {
        this.forClause = [];
    }

    setForClause(forClaluse: string[]) {
        this.forClause.push(...forClaluse);
    }

    setWhereClause(whereClause: WhereLogicalExpressionClass): void {
        this.whereClause.copy(whereClause);
    }

    resetOrderByClause(): void {
        this.orderByClause = [];
    }

    setOrderByClause(orderByClause: FieldOrderClass[]): void {
        this.orderByClause.push(...orderByClause);
    }

    setLimitClause(limitClause: string | ExpressionClass | null): void {
        if (
            this.limitClause instanceof CommonClass &&
            isExpressionClass(this.limitClause) &&
            limitClause instanceof CommonClass &&
            isExpressionClass(limitClause)
        ) {
            this.limitClause.copy(limitClause);
        } else {
            this.limitClause = limitClause;
        }
    }

    resetUpdateList(): void {
        this.updateList = [];
    }

    setUpdateList(updateList: string[]): void {
        this.updateList.push(...updateList);
    }

    setUsingScope(usingScope: string | null): void {
        this.usingScope = usingScope;
    }

    setWithClause(withClause: WithClauseClass): void {
        this.withClause.copy(withClause);
    }

    setGroupByClause(groupByClause: GroupByClauseClass): void {
        this.groupByClause.copy(groupByClause);
    }

    setOffsetClause(offsetClause: string | ExpressionClass | null): void {
        if (
            this.offsetClause instanceof CommonClass &&
            isExpressionClass(this.offsetClause) &&
            offsetClause instanceof CommonClass &&
            isExpressionClass(offsetClause)
        ) {
            this.offsetClause.copy(offsetClause);
        } else {
            this.offsetClause = offsetClause;
        }
    }

    setAllRowsClause(allRowsClause: string | null): void {
        this.allRowsClause = allRowsClause;
    }

    getValue(): EntryClass[] {
        return this.value;
    }

    getFrom(): FromNameClass[] {
        return this.from;
    }

    getForClause(): string[] {
        return this.forClause;
    }

    getWhereClause(): WhereLogicalExpressionClass {
        return this.whereClause;
    }

    getOrderByClause(): FieldOrderClass[] {
        return this.orderByClause;
    }

    getLimitClause(): string | ExpressionClass | null {
        return this.limitClause;
    }

    getUpdateList(): string[] {
        return this.updateList;
    }

    getUsingScope(): string | null {
        return this.usingScope;
    }

    getWithClause(): WithClauseClass {
        return this.withClause;
    }

    getGroupeByClause(): GroupByClauseClass {
        return this.groupByClause;
    }

    getOffsetClause(): string | ExpressionClass | null {
        return this.offsetClause;
    }

    getAllRowsClause(): string | null {
        return this.allRowsClause;
    }

    copy(commonClass: NormalQueryClass): void {
        this.resetValue();
        this.setValue(commonClass.getValue());
        this.resetFrom();
        this.setFrom(commonClass.getFrom());
        this.resetForClause();
        this.setForClause(commonClass.getForClause());
        this.setWhereClause(commonClass.getWhereClause());
        this.resetOrderByClause();
        this.setOrderByClause(commonClass.getOrderByClause());
        this.setLimitClause(commonClass.getLimitClause());
        this.resetUpdateList();
        this.setUpdateList(commonClass.getUpdateList());
        this.setUsingScope(commonClass.getUsingScope());
        this.setWithClause(commonClass.getWithClause());
        this.setOffsetClause(commonClass.getOffsetClause());
        this.setAllRowsClause(commonClass.getAllRowsClause());
    }
}

export const isNormalQueryClass = (target: CommonClass): target is NormalQueryClass => {
    return target instanceof NormalQueryClass;
};

export const normalQueryConvert = (
    target: NormalQueryTypeClass,
    errorClass: ErrorTypeClass[],
): NormalQueryClass => {
    const normalQuery = new NormalQueryClass();

    const valueTypeClass = toTypeClass(target.getValue(), isSelectListType, errorClass);
    if (valueTypeClass) {
        normalQuery.setValue(selectListConvert(valueTypeClass, errorClass));
    }

    const fromTypeClass = toTypeClass(target.getFrom(), isFromNameListType, errorClass);
    if (fromTypeClass) {
        normalQuery.setFrom(fromNameListConvert(fromTypeClass, errorClass));
    }

    const forClauseValue = target.getForClause();
    if (forClauseValue) {
        const forClauseTypeClass = toTypeClass(forClauseValue, isForClausesType, errorClass);
        if (forClauseTypeClass) {
            normalQuery.setForClause(forClausesConvert(forClauseTypeClass, errorClass));
        }
    }

    const orderByClauseValue = target.getOrderByClause();
    if (orderByClauseValue) {
        const orderByClauseTypeClass = toTypeClass(
            orderByClauseValue,
            isOrderByClauseType,
            errorClass,
        );
        if (orderByClauseTypeClass) {
            normalQuery.setOrderByClause(orderByClauseConvert(orderByClauseTypeClass, errorClass));
        }
    }

    const updateListValue = target.getUpdateList();
    if (updateListValue) {
        const updateListTypeClass = toTypeClass(updateListValue, isUpdateListType, errorClass);
        if (updateListTypeClass) {
            normalQuery.setUpdateList(updateListConvert(updateListTypeClass, errorClass));
        }
    }

    const whereClauseValue = target.getWhereClause();
    if (whereClauseValue) {
        const whereClauseTypeClass = toTypeClass(whereClauseValue, isWhereClauseType, errorClass);
        if (whereClauseTypeClass) {
            normalQuery.setWhereClause(whereClauseConvert(whereClauseTypeClass, errorClass));
        }
    }

    const withClauseValue = target.getWithClause();
    if (withClauseValue) {
        const withClauseTypeClass = toTypeClass(withClauseValue, isWithClauseType, errorClass);
        if (withClauseTypeClass) {
            normalQuery.setWithClause(withClauseConvert(withClauseTypeClass, errorClass));
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
            normalQuery.setGroupByClause(groupByClauseConvert(groupByClauseTypeClass, errorClass));
        }
    }

    const limitClauseValue = target.getLimitClause();
    if (limitClauseValue) {
        const limitClauseTypeClass = toTypeClass(limitClauseValue, isLimitClauseType, errorClass);
        if (limitClauseTypeClass) {
            normalQuery.setLimitClause(limitClauseConvert(limitClauseTypeClass, errorClass));
        }
    }

    const usingScopeValue = target.getUsingScope();
    if (usingScopeValue) {
        const usingScopeTypeClass = toTypeClass(usingScopeValue, isUsingScopeType, errorClass);
        if (usingScopeTypeClass) {
            normalQuery.setUsingScope(usingScopeConvert(usingScopeTypeClass, errorClass));
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
            normalQuery.setOffsetClause(offsetClauseConvert(offsetClauseTypeClass, errorClass));
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
            normalQuery.setAllRowsClause(allRowsClauseConvert(allRowsClauseTypeClass, errorClass));
        }
    }

    return normalQuery;
};

export const searchGroupConvert = (
    target: SearchGroupTypeClass,
    errorClass: ErrorTypeClass[],
): string | null => {
    return toPrimitiveValue(
        target.getValue(),
        (target): target is string => typeof target === 'string',
        errorClass,
    );
};

export class SoqlFunctionClass extends CommonClass {
    private value: string | null = null;
    private param:
        | string[]
        | DateFieldNameClass
        | string
        | SoqlFunctionClass
        | (string | (SignedLiteralClass | ExpressionClass)[] | string[] | ExpressionClass)[]
        | null = null;

    setValue(value: string | null): void {
        this.value = value;
    }

    setParam(
        param:
            | string[]
            | DateFieldNameClass
            | string
            | SoqlFunctionClass
            | (string | (SignedLiteralClass | ExpressionClass)[] | string[] | ExpressionClass)[]
            | null,
    ): void {
        if (this.param instanceof CommonClass && param && param instanceof CommonClass) {
            if (isDateFieldNameClass(this.param) && isDateFieldNameClass(param)) {
                this.param.copy(param);
            }
            if (isSoqlFunctionClass(this.param) && isSoqlFunctionClass(param)) {
                this.param.copy(param);
            }
        } else if (isString(this.param) && isString(param)) {
            this.param = param;
        } else if (isStringArray(this.param) && isStringArray(param)) {
            this.param.push(...param);
        } else if (isDistanceValueArray(this.param) && isDistanceValueArray(param)) {
            this.param.push(...param);
        } else {
            this.param = param;
        }
    }

    getValue(): string | null {
        return this.value;
    }

    getParam():
        | string[]
        | DateFieldNameClass
        | string
        | SoqlFunctionClass
        | (string | (SignedLiteralClass | ExpressionClass)[] | string[] | ExpressionClass)[]
        | null {
        return this.param;
    }

    copy(commonClass: SoqlFunctionClass): void {
        this.setValue(commonClass.getValue());
        this.setParam(commonClass.getParam());
    }
}

export const isSoqlFunctionClass = (target: CommonClass): target is SoqlFunctionClass => {
    return target instanceof SoqlFunctionClass;
};

export const soqlFunctionConvert = (
    target: SoqlFunctionTypeClass,
    errorClass: ErrorTypeClass[],
): SoqlFunctionClass => {
    const soqlFunction = new SoqlFunctionClass();

    soqlFunction.setValue(
        toPrimitiveValue(
            target.getValue(),
            (target): target is string => typeof target === 'string',
            errorClass,
        ),
    );

    const paramValue = target.getParam();
    if (Array.isArray(paramValue)) {
        const values: (
            | string
            | string[]
            | (SignedLiteralClass | ExpressionClass)[]
            | string[]
            | ExpressionClass
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

        soqlFunction.setParam(values);
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
                soqlFunction.setParam(fieldNameConvert(paramTypeClass, errorClass));
            }
            if (isDateFieldNameType(paramTypeClass)) {
                soqlFunction.setParam(dateFieldNameConvert(paramTypeClass, errorClass));
            }
            if (isSoqlFieldsParameterType(paramTypeClass)) {
                soqlFunction.setParam(soqlFieldsParameterConvert(paramTypeClass, errorClass));
            }
            if (isSoqlFunctionType(paramTypeClass)) {
                soqlFunction.setParam(soqlFunctionConvert(paramTypeClass, errorClass));
            }
        }
    }

    return soqlFunction;
};

export class SubQueryClass extends CommonClass {
    private value: EntryClass[] = [];
    private from: FromNameClass[] = [];
    private forClause: string[] = [];
    private whereClause: WhereLogicalExpressionClass = new WhereLogicalExpressionClass();
    private orderByClause: FieldOrderClass[] = [];
    private limitClause: string | ExpressionClass | null = null;
    private updateList: string[] = [];

    resetValue(): void {
        this.value = [];
    }

    setValue(value: EntryClass[]): void {
        this.value.push(...value);
    }

    resetFrom(): void {
        this.from = [];
    }

    setFrom(from: FromNameClass[]): void {
        this.from.push(...from);
    }

    resetForClause(): void {
        this.forClause = [];
    }

    setForClause(forClaluse: string[]) {
        this.forClause.push(...forClaluse);
    }

    setWhereClause(whereClause: WhereLogicalExpressionClass): void {
        this.whereClause.copy(whereClause);
    }

    resetOrderByClause(): void {
        this.orderByClause = [];
    }

    setOrderByClause(orderByClause: FieldOrderClass[]): void {
        this.orderByClause.push(...orderByClause);
    }

    setLimitClause(limitClause: string | ExpressionClass | null): void {
        if (
            this.limitClause instanceof CommonClass &&
            isExpressionClass(this.limitClause) &&
            limitClause instanceof CommonClass &&
            isExpressionClass(limitClause)
        ) {
            this.limitClause.copy(limitClause);
        } else {
            this.limitClause = limitClause;
        }
    }

    resetUpdateList(): void {
        this.updateList = [];
    }

    setUpdateList(updateList: string[]): void {
        this.updateList.push(...updateList);
    }

    getValue(): EntryClass[] {
        return this.value;
    }

    getFrom(): FromNameClass[] {
        return this.from;
    }

    getForClause(): string[] {
        return this.forClause;
    }

    getWhereClause(): WhereLogicalExpressionClass {
        return this.whereClause;
    }

    getOrderByClause(): FieldOrderClass[] {
        return this.orderByClause;
    }

    getLimitClause(): string | ExpressionClass | null {
        return this.limitClause;
    }

    getUpdateList(): string[] {
        return this.updateList;
    }

    copy(commonClass: SubQueryClass): void {
        this.resetValue();
        this.setValue(commonClass.getValue());
        this.resetFrom();
        this.setFrom(commonClass.getFrom());
        this.resetForClause();
        this.setForClause(commonClass.getForClause());
        this.setWhereClause(commonClass.getWhereClause());
        this.resetOrderByClause();
        this.setOrderByClause(commonClass.getOrderByClause());
        this.setLimitClause(commonClass.getLimitClause());
        this.resetUpdateList();
        this.setUpdateList(commonClass.getUpdateList());
    }
}

export const isSubQueryClass = (target: CommonClass): target is SubQueryClass => {
    return target instanceof SubQueryClass;
};

export const subQueryConvert = (
    target: SubQueryTypeClass,
    errorClass: ErrorTypeClass[],
): SubQueryClass => {
    const subQuery = new SubQueryClass();

    const valueTypeClass = toTypeClass(target.getValue(), isSubFieldListType, errorClass);
    if (valueTypeClass) {
        subQuery.setValue(subFieldListConvert(valueTypeClass, errorClass));
    }

    const fromTypeClass = toTypeClass(target.getFrom(), isFromNameListType, errorClass);
    if (fromTypeClass) {
        subQuery.setFrom(fromNameListConvert(fromTypeClass, errorClass));
    }

    const forClauseValue = target.getForClause();
    if (forClauseValue) {
        const forClauseTypeClass = toTypeClass(forClauseValue, isForClausesType, errorClass);
        if (forClauseTypeClass) {
            subQuery.setForClause(forClausesConvert(forClauseTypeClass, errorClass));
        }
    }

    const orderByClauseValue = target.getOrderByClause();
    if (orderByClauseValue) {
        const orderByClauseTypeClass = toTypeClass(
            orderByClauseValue,
            isOrderByClauseType,
            errorClass,
        );
        if (orderByClauseTypeClass) {
            subQuery.setOrderByClause(orderByClauseConvert(orderByClauseTypeClass, errorClass));
        }
    }

    const updateListValue = target.getUpdateList();
    if (updateListValue) {
        const updateListTypeClass = toTypeClass(updateListValue, isUpdateListType, errorClass);
        if (updateListTypeClass) {
            subQuery.setUpdateList(updateListConvert(updateListTypeClass, errorClass));
        }
    }

    const whereClauseValue = target.getWhereClause();
    if (whereClauseValue) {
        const whereClauseTypeClass = toTypeClass(whereClauseValue, isWhereClauseType, errorClass);
        if (whereClauseTypeClass) {
            subQuery.setWhereClause(whereClauseConvert(whereClauseTypeClass, errorClass));
        }
    }

    const limitClauseValue = target.getLimitClause();
    if (limitClauseValue) {
        const limitClauseTypeClass = toTypeClass(limitClauseValue, isLimitClauseType, errorClass);
        if (limitClauseTypeClass) {
            subQuery.setLimitClause(limitClauseConvert(limitClauseTypeClass, errorClass));
        }
    }

    return subQuery;
};
