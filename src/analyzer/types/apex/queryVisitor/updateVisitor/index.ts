import {
    ApexParserBaseVisitor,
    UpdateListContext,
    UpdateTypeContext,
} from '@apexdevtools/apex-parser';

import { makeUpdateListType, UpdateListType } from './updateList';
import { makeUpdateTypeType, UpdateTypeType } from './updateType';

export type UpdateType = UpdateListType | UpdateTypeType;

export class UpdateVisitor extends ApexParserBaseVisitor<UpdateType> {
    visitUpdateListContext(ctx: UpdateListContext) {
        return makeUpdateListType(ctx);
    }

    visitUpdateTypeContext(ctx: UpdateTypeContext) {
        return makeUpdateTypeType(ctx);
    }
}
