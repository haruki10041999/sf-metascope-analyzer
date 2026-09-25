import {
    ApexParserBaseVisitor,
    MethodCallContext,
    DotMethodCallContext,
} from '@apexdevtools/apex-parser';

import { MethodCallType, makeMethodCallType } from './methodCall';
import { DotMethodCallType, makeDotMethodCallType } from './dotMethodCall';

export type CallType = MethodCallType | DotMethodCallType;

export class CallVisitor extends ApexParserBaseVisitor<CallType> {
    visitMethodCallContext(ctx: MethodCallContext) {
        return makeMethodCallType(ctx);
    }

    visitDotMethodCallContext(ctx: DotMethodCallContext) {
        return makeDotMethodCallType(ctx);
    }
}
