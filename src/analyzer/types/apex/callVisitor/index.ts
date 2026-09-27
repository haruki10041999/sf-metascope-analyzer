import {
    ApexParserBaseVisitor,
    MethodCallContext,
    DotMethodCallContext,
} from '@apexdevtools/apex-parser';

import { MethodCallType, makeMethodCallType } from './methodCall';
import { DotMethodCallType, makeDotMethodCallType } from './dotMethodCall';

export type CallType = MethodCallType | DotMethodCallType;

export class CallVisitor extends ApexParserBaseVisitor<CallType> {
    visitMethodCall(ctx: MethodCallContext) {
        return makeMethodCallType(ctx);
    }

    visitDotMethodCall(ctx: DotMethodCallContext) {
        return makeDotMethodCallType(ctx);
    }
}
