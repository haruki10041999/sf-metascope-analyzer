import {
    ApexParserBaseVisitor,
    QualifiedNameContext,
    TypeNameContext,
    CreatedNameContext,
    FieldNameContext,
    DateFieldNameContext,
    DataCategoryNameContext,
} from '@apexdevtools/apex-parser';

import { QualifiedNameTypeClass } from './qualifiedName';
import { TypeNameTypeClass } from './typeName';
import { makeCreatedNameType, CreatedNameType } from './createName';
import { FieldNameTypeClass } from './fieldName';
import { DateFieldNameTypeClass } from './dateFieldName';
import { DataCategoryNameTypeClass } from './dataCategoryName';

import { ContextTypeClass, ErrorTypeClass, CommonTypeClass, CommonVisitor } from '../commonVisitor';

export { isQualifiedNameType, QualifiedNameTypeClass } from './qualifiedName';
export { isTypeNameType, TypeNameTypeClass } from './typeName';
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
        console.log('解析を開始します。' + 'CreatedNameContext:  ' + ctx.getText());
        const result = makeCreatedNameType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'CreatedNameContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
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
