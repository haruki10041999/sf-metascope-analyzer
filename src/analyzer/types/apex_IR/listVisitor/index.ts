import {
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

import { TypeListTypeClass } from './typeList';
import { ExpressionListTypeClass } from './expressionList';
import { FieldNameListTypeClass } from './fieldNameList';
import { FormalParameterListTypeClass } from './formalParameterList';
import { ValueListTypeClass } from './valueList';
import { UpdateListType, makeUpdateListType } from './updateList';
import { NetworkListType, makeNetworkListType } from './networkList';
import { FromNameListTypeClass } from './fromNameList';
import { FieldGroupByListType, makeFieldGroupByListType } from './fieldGroupByList';
import { FieldOrderListType, makeFieldOrderListType } from './fieldOrderList';
import { SelectListType, makeSelectListType } from './selectList';
import { SubFieldListType, makeSubFieldListType } from './subFieldList';
import { FieldListType, makeFieldListType } from './fieldList';
import { FieldSpecListType, makeFieldSpecListType } from './fieldSpecList';

import { CommonTypeClass, ErrorTypeClass, CommonVisitor } from '../commonVisitor';

export { isTypeListType, TypeListTypeClass } from './typeList';
export { isFormalParameterListType, FormalParameterListTypeClass } from './formalParameterList';
export { isValueListType, ValueListTypeClass } from './valueList';
export { isExpressionListType, ExpressionListTypeClass } from './expressionList';
export { isFieldNameListType, FieldNameListTypeClass } from './fieldNameList';
export { isFromNameListType, FromNameListTypeClass } from './fromNameList';

export class ListTypeClass<T> extends CommonTypeClass {
    private value: (T | ErrorTypeClass)[];

    constructor(type: string, value: (T | ErrorTypeClass)[]) {
        super(type);
        this.value = value;
    }

    getValue(): (T | ErrorTypeClass)[] {
        return this.value;
    }
}

export const isListTypeAll = (target: CommonTypeClass): target is ListTypeClass<unknown> => {
    return target instanceof ListTypeClass;
};

export class ListVisitor extends CommonVisitor<ListTypeClass<unknown>> {
    visitTypeList(ctx: TypeListContext) {
        return TypeListTypeClass.create(ctx);
    }
    visitExpressionList(ctx: ExpressionListContext) {
        return ExpressionListTypeClass.create(ctx);
    }

    visitFormalParameterList(ctx: FormalParameterListContext) {
        return FormalParameterListTypeClass.create(ctx);
    }

    visitValueList(ctx: ValueListContext) {
        return ValueListTypeClass.create(ctx);
    }

    visitFieldNameList(ctx: FieldNameListContext) {
        console.log('解析を開始します。' + 'FieldNameListContext:  ' + ctx.getText());
        return FieldNameListTypeClass.create(ctx);
    }

    visitUpdateList(ctx: UpdateListContext) {
        console.log('解析を開始します。' + 'UpdateListContext:  ' + ctx.getText());
        return UpdateListType.create(ctx);
    }

    visitNetworkList(ctx: NetworkListContext) {
        console.log('解析を開始します。' + 'NetworkListContext:  ' + ctx.getText());
        return NetworkListType.create(ctx);
    }

    visitFromNameList(ctx: FromNameListContext) {
        return FromNameListTypeClass.create(ctx);
    }

    visitFieldGroupByList(ctx: FieldGroupByListContext) {
        console.log('解析を開始します。' + 'FieldGroupByListContext:  ' + ctx.getText());
        return FieldGroupByListType.create(ctx);
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
