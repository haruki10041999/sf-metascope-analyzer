import {
    ApexParserBaseVisitor,
    ExpressionListContext,
    FormalParameterListContext,
    TypeListContext,
} from '@apexdevtools/apex-parser';

import { TypeListType, makeTypeListType } from './typeList';
import { ExpressionListType, makeExpressionListType } from './expressionList';
import { FormalParameterListType, makeFormalParameterListType } from './formalParameterList';
export type ListType = TypeListType | ExpressionListType | FormalParameterListType;

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
}
