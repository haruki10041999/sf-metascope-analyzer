import {
    ApexParserBaseVisitor,
    AnonymousBlockMemberContext,
    TriggerBlockMemberContext,
} from '@apexdevtools/apex-parser';

import { AnonymousBlockMemberType, makeAnonymousBlockMemberType } from './anonymousBlockMember';
import { TriggerBlockMemberType, makeTriggerBlockMemberType } from './triggerBlockMember';

export type MemberType = AnonymousBlockMemberType | TriggerBlockMemberType;

export class MemberVisitor extends ApexParserBaseVisitor<MemberType> {
    visitAnonymousBlockMemberContext(ctx: AnonymousBlockMemberContext) {
        return makeAnonymousBlockMemberType(ctx);
    }

    visitTriggerBlockMemberContext(ctx: TriggerBlockMemberContext) {
        return makeTriggerBlockMemberType(ctx);
    }
}
