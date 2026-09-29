import {
    ApexParserBaseVisitor,
    AnonymousBlockMemberContext,
    TriggerBlockMemberContext,
} from '@apexdevtools/apex-parser';

import { AnonymousBlockMemberType, makeAnonymousBlockMemberType } from './anonymousBlockMember';
import { TriggerBlockMemberType, makeTriggerBlockMemberType } from './triggerBlockMember';

import { ErrorType, CommonVisitor } from '../commonVisitor';

export type MemberType = AnonymousBlockMemberType | TriggerBlockMemberType | ErrorType;

export class MemberVisitor extends CommonVisitor<MemberType> {
    visitAnonymousBlockMember(ctx: AnonymousBlockMemberContext) {
        console.log('解析を開始します。' + 'AnonymousBlockMemberContext:  ' + ctx.getText());
        const result = makeAnonymousBlockMemberType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'AnonymousBlockMemberContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitTriggerBlockMember(ctx: TriggerBlockMemberContext) {
        console.log('解析を開始します。' + 'TriggerBlockMemberContext:  ' + ctx.getText());
        const result = makeTriggerBlockMemberType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'TriggerBlockMemberContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }
}

