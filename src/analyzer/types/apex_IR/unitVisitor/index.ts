import {
    ApexParserBaseVisitor,
    CompilationUnitContext,
    AnonymousUnitContext,
    TriggerUnitContext,
    TriggerCaseContext,
} from '@apexdevtools/apex-parser';

import { CompilationUnitType, makeCompilationUnitType } from './compilationUnit';
import { AnonymousUnitType, makeAnonymousUnitType } from './anonymousUnit';
import { TriggerUnitType, makeTriggerUnitType } from './triggerUnit';
import { TriggerCaseType, makeTriggerCaseType } from './triggerCase';

import { ErrorType, CommonVisitor } from '../commonVisitor';

export type UnitType =
    CompilationUnitType | AnonymousUnitType | TriggerUnitType | TriggerCaseType | ErrorType;

export class UnitVisitor extends CommonVisitor<UnitType> {
    visitCompilationUnit(ctx: CompilationUnitContext) {
        console.log('解析を開始します。' + 'CompilationUnitContext:  ' + ctx.getText());
        const result = makeCompilationUnitType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'CompilationUnitContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitAnonymousUnit(ctx: AnonymousUnitContext) {
        console.log('解析を開始します。' + 'AnonymousUnitContext:  ' + ctx.getText());
        const result = makeAnonymousUnitType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'AnonymousUnitContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitTriggerUnit(ctx: TriggerUnitContext) {
        console.log('解析を開始します。' + 'TriggerUnitContext:  ' + ctx.getText());
        const result = makeTriggerUnitType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'TriggerUnitContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitTriggerCase(ctx: TriggerCaseContext) {
        console.log('解析を開始します。' + 'TriggerCaseContext:  ' + ctx.getText());
        const result = makeTriggerCaseType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'TriggerCaseContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }
}

