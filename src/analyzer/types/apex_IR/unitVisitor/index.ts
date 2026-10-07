import {
    ApexParserBaseVisitor,
    CompilationUnitContext,
    AnonymousUnitContext,
    TriggerUnitContext,
    TriggerCaseContext,
} from '@apexdevtools/apex-parser';

// 各ファイルより先に base を評価させ、循環 import 時の TDZ を防ぐ
export * from './base';
import type { UnitAllTypeClass } from './base';

import { CompilationUnitTypeClass } from './compilationUnit';
import { AnonymousUnitTypeClass } from './anonymousUnit';
import { TriggerUnitTypeClass } from './triggerUnit';
import { TriggerCaseTypeClass } from './triggerCase';

import { CommonVisitor } from '../commonVisitor';

export { isCompilationUnitType, CompilationUnitTypeClass } from './compilationUnit';
export { isAnonymousUnitType, AnonymousUnitTypeClass } from './anonymousUnit';
export { isTriggerUnitType, TriggerUnitTypeClass } from './triggerUnit';

export { isTriggerCaseType, TriggerCaseTypeClass } from './triggerCase';

export class UnitVisitor extends CommonVisitor<UnitAllTypeClass> {
    visitCompilationUnit(ctx: CompilationUnitContext) {
        return CompilationUnitTypeClass.create(ctx);
    }

    visitAnonymousUnit(ctx: AnonymousUnitContext) {
        return AnonymousUnitTypeClass.create(ctx);
    }

    visitTriggerUnit(ctx: TriggerUnitContext) {
        return TriggerUnitTypeClass.create(ctx);
    }

    visitTriggerCase(ctx: TriggerCaseContext) {
        return TriggerCaseTypeClass.create(ctx);
    }
}

