import {
    QualifiedNameContext,
    TypeNameContext,
    CreatedNameContext,
    FieldNameContext,
    DateFieldNameContext,
    DataCategoryNameContext,
} from '@apexdevtools/apex-parser';

// 各ファイルより先に base を評価させ、循環 import 時の TDZ を防ぐ
export * from './base';
import type { NameAllTypeClass } from './base';

import { QualifiedNameTypeClass } from './qualifiedName';
import { TypeNameTypeClass } from './typeName';
import { CreatedNameTypeClass } from './createName';
import { FieldNameTypeClass } from './fieldName';
import { DateFieldNameTypeClass } from './dateFieldName';
import { DataCategoryNameTypeClass } from './dataCategoryName';

import { CommonVisitor } from '../commonVisitor';

export { isQualifiedNameType, QualifiedNameTypeClass } from './qualifiedName';
export { isTypeNameType, TypeNameTypeClass } from './typeName';
export { isCreatedNameType, CreatedNameTypeClass } from './createName';
export { isFieldNameType, FieldNameTypeClass } from './fieldName';
export { isDateFieldNameType, DateFieldNameTypeClass } from './dateFieldName';
export { isDataCategoryNameType, DataCategoryNameTypeClass } from './dataCategoryName';

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
