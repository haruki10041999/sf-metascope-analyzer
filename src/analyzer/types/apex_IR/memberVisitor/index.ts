import {
    ApexParserBaseVisitor,
    AnonymousBlockMemberContext,
    TriggerBlockMemberContext,
} from '@apexdevtools/apex-parser';

// 各ファイルより先に base を評価させ、循環 import 時の TDZ を防ぐ
export * from './base';
import type { MemberTypeClass } from './base';

import { AnonymousBlockMemberTypeClass } from './anonymousBlockMember';
import { TriggerBlockMemberTypeClass } from './triggerBlockMember';

import { ApexCommonVisitor } from '../commonVisitor';

export { isAnonymousBlockMemberType, AnonymousBlockMemberTypeClass } from './anonymousBlockMember';
export { isTriggerBlockMemberType, TriggerBlockMemberTypeClass } from './triggerBlockMember';

export class MemberVisitor extends ApexCommonVisitor<MemberTypeClass<string, unknown>> {
    visitAnonymousBlockMember(ctx: AnonymousBlockMemberContext) {
        return AnonymousBlockMemberTypeClass.create(ctx);
    }

    visitTriggerBlockMember(ctx: TriggerBlockMemberContext) {
        return TriggerBlockMemberTypeClass.create(ctx);
    }
}

