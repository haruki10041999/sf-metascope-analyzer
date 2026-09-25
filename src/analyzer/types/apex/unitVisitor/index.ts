import {
    ApexParserBaseVisitor,
    CompilationUnitContext,
    AnonymousUnitContext,
} from '@apexdevtools/apex-parser';

import { CompilationUnitType, makeCompilationUnitType } from './compilationUnit';
import { AnonymousUnitType, makeAnonymousUnitType } from './anonymousUnit';

export type UnitType = CompilationUnitType | AnonymousUnitType;

export class unitVisitor extends ApexParserBaseVisitor<UnitType> {
    visitCompilationUnitContext(ctx: CompilationUnitContext) {
        return makeCompilationUnitType(ctx);
    }

    visitAnonymousUnitContext(ctx: AnonymousUnitContext) {
        return makeAnonymousUnitType(ctx);
    }
}
