import {
    ApexParserBaseVisitor,
    AnonymousBlockMemberContext,
    TriggerBlockMemberContext,
} from '@apexdevtools/apex-parser';

import { AnonymousBlockMemberType, makeAnonymousBlockMemberType } from './anonymousBlockMember';
import { TriggerBlockMemberType, makeTriggerBlockMemberType } from './triggerBlockMember';

export type MemberType = AnonymousBlockMemberType | TriggerBlockMemberType;

export class MemberVisitor extends ApexParserBaseVisitor<MemberType> {
    visitAnonymousBlockMember(ctx: AnonymousBlockMemberContext) {
        return makeAnonymousBlockMemberType(ctx);
    }

    visitTriggerBlockMember(ctx: TriggerBlockMemberContext) {
        return makeTriggerBlockMemberType(ctx);
    }
}
