import {
    QualifiedNameContext,
    TypeNameContext,
    CreatedNameContext,
    FieldNameContext,
    DateFieldNameContext,
    DataCategoryNameContext,
} from '@apexdevtools/apex-parser';

import { QualifiedNameTypeClass } from './qualifiedName';
import { TypeNameTypeClass } from './typeName';
import { CreatedNameTypeClass } from './createName';
import { FieldNameTypeClass } from './fieldName';
import { DateFieldNameTypeClass } from './dateFieldName';
import { DataCategoryNameTypeClass } from './dataCategoryName';

import { ErrorTypeClass, CommonTypeClass, CommonVisitor } from '../commonVisitor';

export { isQualifiedNameType, QualifiedNameTypeClass } from './qualifiedName';
export { isTypeNameType, TypeNameTypeClass } from './typeName';
export { isCreatedNameType, CreatedNameTypeClass } from './createName';
export { isFieldNameType, FieldNameTypeClass } from './fieldName';
export { isDateFieldNameType, DateFieldNameTypeClass } from './dateFieldName';
export { isDataCategoryNameType, DataCategoryNameTypeClass } from './dataCategoryName';

export class NameTypeClass<T> extends CommonTypeClass {
    private value: T | ErrorTypeClass;
    constructor(type: string, value: T | ErrorTypeClass) {
        super(type);
        this.value = value;
    }

    getValue(): T | ErrorTypeClass {
        return this.value;
    }
}

export class NameListTypeClass<T> extends CommonTypeClass {
    private value: (T | ErrorTypeClass)[];
    constructor(type: string, value: (T | ErrorTypeClass)[]) {
        super(type);
        this.value = value;
    }

    getValue(): (T | ErrorTypeClass)[] {
        return this.value;
    }
}

export type NameAllTypeClass = NameTypeClass<unknown> | NameListTypeClass<unknown>;

export const isNameTypeAll = (target: CommonTypeClass): target is NameAllTypeClass => {
    return target instanceof NameTypeClass || target instanceof NameListTypeClass;
};

export class NameVisitor extends CommonVisitor<NameAllTypeClass> {
    visitQualifiedName(ctx: QualifiedNameContext) {
        return QualifiedNameTypeClass.create(ctx);
    }

    visitTypeName(ctx: TypeNameContext) {
        return TypeNameTypeClass.create(ctx);
    }

    visitCreatedName(ctx: CreatedNameContext) {
        return CreatedNameTypeClass.create(ctx);
    }

    visitFieldName(ctx: FieldNameContext) {
        return FieldNameTypeClass.create(ctx);
    }

    visitDateFieldName(ctx: DateFieldNameContext) {
        return DateFieldNameTypeClass.create(ctx);
    }

    visitDataCategoryName(ctx: DataCategoryNameContext) {
        return DataCategoryNameTypeClass.create(ctx);
    }
}
