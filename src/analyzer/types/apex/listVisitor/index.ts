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
    visitTypeList(ctx: TypeListContext): ListType {
        return makeTypeListType(ctx);
    }
    visitExpressionList(ctx: ExpressionListContext): ListType {
        return makeExpressionListType(ctx);
    }

    visitFormalParameterList(ctx: FormalParameterListContext): ListType {
        return makeFormalParameterListType(ctx);
    }

    visitValueList(ctx: ValueListContext) {
        return makeValueListType(ctx);
    }

    visitFieldNameList(ctx: FieldNameListContext) {
        return makeFieldNameListType(ctx);
    }

    visitUpdateList(ctx: UpdateListContext) {
        return makeUpdateListType(ctx);
    }

    visitNetworkList(ctx: NetworkListContext) {
        return makeNetworkListType(ctx);
    }

    visitFromNameList(ctx: FromNameListContext) {
        return makeFromNameListType(ctx);
    }

    visitFieldGroupByList(ctx: FieldGroupByListContext) {
        return makeFieldGroupByListType(ctx);
    }

    visitFieldOrderList(ctx: FieldOrderListContext) {
        return makeFieldOrderListType(ctx);
    }

    visitSelectList(ctx: SelectListContext) {
        return makeSelectListType(ctx);
    }

    visitSubFieldList(ctx: SubFieldListContext) {
        return makeSubFieldListType(ctx);
    }

    visitFieldList(ctx: FieldListContext) {
        return makeFieldListType(ctx);
    }

    visitFieldSpecList(ctx: FieldSpecListContext) {
        return makeFieldSpecListType(ctx);
    }
}
