import {
    ApexParserBaseVisitor,
    CompilationUnitContext,
    AnonymousUnitContext,
    TriggerUnitContext,
} from '@apexdevtools/apex-parser';

import { CompilationUnitType, makeCompilationUnitType } from './compilationUnit';
import { AnonymousUnitType, makeAnonymousUnitType } from './anonymousUnit';
import { TriggerUnitType, makeTriggerUnitType } from './triggerUnit';

export type UnitType = CompilationUnitType | AnonymousUnitType | TriggerUnitType;

export class UnitVisitor extends ApexParserBaseVisitor<UnitType> {
    visitCompilationUnitContext(ctx: CompilationUnitContext) {
        return makeCompilationUnitType(ctx);
    }

    visitAnonymousUnitContext(ctx: AnonymousUnitContext) {
        return makeAnonymousUnitType(ctx);
    }

    visitTriggerUnitContext(ctx: TriggerUnitContext) {
        return makeTriggerUnitType(ctx);
    }
}
