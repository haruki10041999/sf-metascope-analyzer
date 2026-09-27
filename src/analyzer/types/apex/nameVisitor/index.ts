import {
    ApexParserBaseVisitor,
    QualifiedNameContext,
    TypeNameContext,
    CreatedNameContext,
    FieldNameContext,
    DateFieldNameContext,
    DataCategoryNameContext,
} from '@apexdevtools/apex-parser';

import { makeQualifiedNameType, QualifiedNameType } from './qualifiedName';
import { makeTypeNameType, TypeNameType } from './typeName';
import { makeCreatedNameType, CreatedNameType } from './createName';
import { makeFieldNameType, FieldNameType } from './fieldName';
import { makeDateFieldNameType, DateFieldNameType } from './dateFieldName';
import { makeDataCategoryNameType, DataCategoryNameType } from './dataCategoryName';

export type NameType =
    | QualifiedNameType
    | TypeNameType
    | CreatedNameType
    | FieldNameType
    | DateFieldNameType
    | DataCategoryNameType;

export class NameVisitor extends ApexParserBaseVisitor<NameType> {
    visitQualifiedName(ctx: QualifiedNameContext): NameType {
        return makeQualifiedNameType(ctx);
    }

    visitTypeName(ctx: TypeNameContext): NameType {
        return makeTypeNameType(ctx);
    }

    visitCreatedName(ctx: CreatedNameContext): NameType {
        return makeCreatedNameType(ctx);
    }

    visitFieldName(ctx: FieldNameContext): NameType {
        return makeFieldNameType(ctx);
    }

    visitDateFieldName(ctx: DateFieldNameContext): NameType {
        return makeDateFieldNameType(ctx);
    }

    visitDataCategoryName(ctx: DataCategoryNameContext): NameType {
        return makeDataCategoryNameType(ctx);
    }
}
