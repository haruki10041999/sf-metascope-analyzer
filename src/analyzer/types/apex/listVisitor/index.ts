import {
    ApexParserBaseVisitor,
    ExpressionListContext,
    FieldNameListContext,
    FormalParameterListContext,
    TypeListContext,
    ValueListContext,
    NetworkListContext,
} from '@apexdevtools/apex-parser';

import { TypeListType, makeTypeListType } from './typeList';
import { ExpressionListType, makeExpressionListType } from './expressionList';
import { FieldNameListType, makeFieldNameListType } from './fieldNameList';
import { FormalParameterListType, makeFormalParameterListType } from './formalParameterList';
import { ValueListType, makeValueListType } from './valueList';
import { NetworkListType, makeNetworkListType } from './networkList';

export type ListType =
    | TypeListType
    | ExpressionListType
    | FormalParameterListType
    | ValueListType
    | FieldNameListType
    | NetworkListType;

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

    visitNetworkListContext(ctx: NetworkListContext) {
        return makeNetworkListType(ctx);
    }
}
