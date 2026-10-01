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
CreatedNameTypeClass;
import { DataCategoryNameTypeClass } from './dataCategoryName';

import { ContextTypeClass, ErrorTypeClass, CommonTypeClass, CommonVisitor } from '../commonVisitor';

export { isQualifiedNameType, QualifiedNameTypeClass } from './qualifiedName';
export { isTypeNameType, TypeNameTypeClass } from './typeName';
export { isCreatedNameType, CreatedNameTypeClass } from './createName';
export { isFieldNameType, FieldNameTypeClass } from './fieldName';
export { isDateFieldNameType, DateFieldNameTypeClass } from './dateFieldName';
export { isDataCategoryNameType, DataCategoryNameTypeClass } from './dataCategoryName';

export class NameTypeClass<T> extends ContextTypeClass<T> {
    constructor(type: string, value: T | null, errorClasses: Record<string, ErrorTypeClass>) {
        super(type, value, errorClasses);
    }
}

export const isNameTypeAll = (target: CommonTypeClass): target is NameTypeClass<unknown> => {
    return target instanceof NameTypeClass;
};

export class NameVisitor extends CommonVisitor<NameTypeClass<unknown>> {
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
