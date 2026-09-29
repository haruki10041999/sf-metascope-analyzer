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

import { ContextTypeClass, CommonVisitor } from '../commonVisitor';

export type NameType =
    | QualifiedNameType
    | TypeNameType
    | CreatedNameType
    | FieldNameType
    | DateFieldNameType
    | DataCategoryNameType
    | ErrorType;

export class NameVisitor extends CommonVisitor<NameType> {
    visitQualifiedName(ctx: QualifiedNameContext) {
        console.log('解析を開始します。' + 'QualifiedNameContext:  ' + ctx.getText());
        const result = makeQualifiedNameType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'QualifiedNameContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitTypeName(ctx: TypeNameContext) {
        console.log('解析を開始します。' + 'TypeNameContext:  ' + ctx.getText());
        const result = makeTypeNameType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'TypeNameContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
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
        console.log('解析を開始します。' + 'FieldNameContext:  ' + ctx.getText());
        const result = makeFieldNameType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'FieldNameContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitDateFieldName(ctx: DateFieldNameContext) {
        console.log('解析を開始します。' + 'DateFieldNameContext:  ' + ctx.getText());
        const result = makeDateFieldNameType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'DateFieldNameContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitDataCategoryName(ctx: DataCategoryNameContext) {
        console.log('解析を開始します。' + 'DataCategoryNameContext:  ' + ctx.getText());
        const result = makeDataCategoryNameType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'DataCategoryNameContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }
}
