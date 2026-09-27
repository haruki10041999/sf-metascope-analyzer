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
    visitTypeListContext(ctx: TypeListContext): ListType {
        return makeTypeListType(ctx);
    }
    visitExpressionListContext(ctx: ExpressionListContext): ListType {
        return makeExpressionListType(ctx);
    }

    visitFormalParameterListContext(ctx: FormalParameterListContext): ListType {
        return makeFormalParameterListType(ctx);
    }

    visitValueListContext(ctx: ValueListContext) {
        return makeValueListType(ctx);
    }

    visitFieldNameListContext(ctx: FieldNameListContext) {
        return makeFieldNameListType(ctx);
    }

    visitUpdateListContext(ctx: UpdateListContext) {
        return makeUpdateListType(ctx);
    }

    visitNetworkListContext(ctx: NetworkListContext) {
        return makeNetworkListType(ctx);
    }

    visitFromNameListContext(ctx: FromNameListContext) {
        return makeFromNameListType(ctx);
    }

    visitFieldGroupByListContext(ctx: FieldGroupByListContext) {
        return makeFieldGroupByListType(ctx);
    }

    visitFieldOrderListContext(ctx: FieldOrderListContext) {
        return makeFieldOrderListType(ctx);
    }

    visitSelectListContext(ctx: SelectListContext) {
        return makeSelectListType(ctx);
    }

    visitSubFieldListContext(ctx: SubFieldListContext) {
        return makeSubFieldListType(ctx);
    }

    visitFieldListContext(ctx: FieldListContext) {
        return makeFieldListType(ctx);
    }

    visitFieldSpecListContext(ctx: FieldSpecListContext) {
        return makeFieldSpecListType(ctx);
    }
}
