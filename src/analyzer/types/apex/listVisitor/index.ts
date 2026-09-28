import {
    ApexParserBaseVisitor,
    ExpressionListContext,
    FieldNameListContext,
    FormalParameterListContext,
    TypeListContext,
    ValueListContext,
    UpdateListContext,
    NetworkListContext,
    FromNameListContext,
    FieldGroupByListContext,
    FieldOrderListContext,
    SelectListContext,
    SubFieldListContext,
    FieldListContext,
    FieldSpecListContext,
} from '@apexdevtools/apex-parser';

import { TypeListType, makeTypeListType } from './typeList';
import { ExpressionListType, makeExpressionListType } from './expressionList';
import { FieldNameListType, makeFieldNameListType } from './fieldNameList';
import { FormalParameterListType, makeFormalParameterListType } from './formalParameterList';
import { ValueListType, makeValueListType } from './valueList';
import { UpdateListType, makeUpdateListType } from './updateList';
import { NetworkListType, makeNetworkListType } from './networkList';
import { FromNameListType, makeFromNameListType } from './fromNameList';
import { FieldGroupByListType, makeFieldGroupByListType } from './fieldGroupByList';
import { FieldOrderListType, makeFieldOrderListType } from './fieldOrderList';
import { SelectListType, makeSelectListType } from './selectList';
import { SubFieldListType, makeSubFieldListType } from './subFieldList';
import { FieldListType, makeFieldListType } from './fieldList';
import { FieldSpecListType, makeFieldSpecListType } from './fieldSpecList';

export type ListType =
    | TypeListType
    | ExpressionListType
    | FormalParameterListType
    | ValueListType
    | FieldNameListType
    | UpdateListType
    | NetworkListType
    | FromNameListType
    | FieldGroupByListType
    | FieldOrderListType
    | SelectListType
    | SubFieldListType
    | FieldListType
    | FieldSpecListType;

export class ListVisitor extends ApexParserBaseVisitor<ListType> {
    visitTypeList(ctx: TypeListContext) {
        console.log('解析を開始します。' + 'TypeListContext:  ' + ctx.getText());
        const result = makeTypeListType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'TypeListContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }
    visitExpressionList(ctx: ExpressionListContext) {
        console.log('解析を開始します。' + 'ExpressionListContext:  ' + ctx.getText());
        const result = makeExpressionListType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'ExpressionListContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitFormalParameterList(ctx: FormalParameterListContext) {
        console.log('解析を開始します。' + 'FormalParameterListContext:  ' + ctx.getText());
        const result = makeFormalParameterListType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'FormalParameterListContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitValueList(ctx: ValueListContext) {
        console.log('解析を開始します。' + 'ValueListContext:  ' + ctx.getText());
        const result = makeValueListType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'ValueListContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitFieldNameList(ctx: FieldNameListContext) {
        console.log('解析を開始します。' + 'FieldNameListContext:  ' + ctx.getText());
        const result = makeFieldNameListType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'FieldNameListContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitUpdateList(ctx: UpdateListContext) {
        console.log('解析を開始します。' + 'UpdateListContext:  ' + ctx.getText());
        const result = makeUpdateListType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'UpdateListContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitNetworkList(ctx: NetworkListContext) {
        console.log('解析を開始します。' + 'NetworkListContext:  ' + ctx.getText());
        const result = makeNetworkListType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'NetworkListContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitFromNameList(ctx: FromNameListContext) {
        console.log('解析を開始します。' + 'FromNameListContext:  ' + ctx.getText());
        const result = makeFromNameListType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'FromNameListContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitFieldGroupByList(ctx: FieldGroupByListContext) {
        console.log('解析を開始します。' + 'FieldGroupByListContext:  ' + ctx.getText());
        const result = makeFieldGroupByListType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'FieldGroupByListContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitFieldOrderList(ctx: FieldOrderListContext) {
        console.log('解析を開始します。' + 'FieldOrderListContext:  ' + ctx.getText());
        const result = makeFieldOrderListType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'FieldOrderListContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitSelectList(ctx: SelectListContext) {
        console.log('解析を開始します。' + 'SelectListContext:  ' + ctx.getText());
        const result = makeSelectListType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'SelectListContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitSubFieldList(ctx: SubFieldListContext) {
        console.log('解析を開始します。' + 'SubFieldListContext:  ' + ctx.getText());
        const result = makeSubFieldListType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'SubFieldListContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitFieldList(ctx: FieldListContext) {
        console.log('解析を開始します。' + 'FieldListContext:  ' + ctx.getText());
        const result = makeFieldListType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'FieldListContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitFieldSpecList(ctx: FieldSpecListContext) {
        console.log('解析を開始します。' + 'FieldSpecListContext:  ' + ctx.getText());
        const result = makeFieldSpecListType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'FieldSpecListContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }
}
