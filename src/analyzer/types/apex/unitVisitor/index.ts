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
    visitCompilationUnit(ctx: CompilationUnitContext) {
        return makeCompilationUnitType(ctx);
    }

    visitAnonymousUnit(ctx: AnonymousUnitContext) {
        return makeAnonymousUnitType(ctx);
    }

    visitTriggerUnit(ctx: TriggerUnitContext) {
        return makeTriggerUnitType(ctx);
    }
}
