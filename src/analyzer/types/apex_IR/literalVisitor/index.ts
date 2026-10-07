import {
    ApexParserBaseVisitor,
    LiteralContext,
    WhenLiteralContext,
    SoslLiteralContext,
    SoslLiteralAltContext,
    SignedIntegerContext,
    SignedNumberContext,
    SoqlLiteralContext,
} from '@apexdevtools/apex-parser';

// 各ファイルより先に base を評価させ、循環 import 時の TDZ を防ぐ
export * from './base';
import type { LiteralAllTypeClass } from './base';

import { NormalLiteralTypeClass } from './normal';
import { WhenLiteralTypeClass } from './whenLiteral';
import { SoslLiteralTypeClass } from './soslLiteral';
import { SoslLiteralAltTypeClass } from './soslLiteralAlt';
import { SignedIntegerTypeClass } from './signedInteger';
import { SignedNumberTypeClass } from './signedNumber';
import { SoqlLiteralTypeClass } from './soqlLiteral';

import { CommonVisitor } from '../commonVisitor';

export { isNormalLiteralType, NormalLiteralTypeClass } from './normal';
export { isWhenLiteralType, WhenLiteralTypeClass } from './whenLiteral';
export { isSignedIntegerType, SignedIntegerTypeClass } from './signedInteger';
export { isSignedNumberType, SignedNumberTypeClass } from './signedNumber';
export { isSoqlLiteralType, SoqlLiteralTypeClass } from './soqlLiteral';
export { isSoslLiteralType, SoslLiteralTypeClass } from './soslLiteral';
export { isSoslLiteralAltType, SoslLiteralAltTypeClass } from './soslLiteralAlt';

export class LiteralVisitor extends CommonVisitor<LiteralAllTypeClass> {
    visitLiteral(ctx: LiteralContext) {
        return NormalLiteralTypeClass.create(ctx);
    }

    visitWhenLiteral(ctx: WhenLiteralContext) {
        return WhenLiteralTypeClass.create(ctx);
    }

    visitSoslLiteral(ctx: SoslLiteralContext) {
        return SoslLiteralTypeClass.create(ctx);
    }

    visitSoslLiteralAlt(ctx: SoslLiteralAltContext) {
        return SoslLiteralAltTypeClass.create(ctx);
    }

    visitSignedInteger(ctx: SignedIntegerContext) {
        return SignedIntegerTypeClass.create(ctx);
    }

    visitSignedNumber(ctx: SignedNumberContext) {
        return SignedNumberTypeClass.create(ctx);
    }

    visitSoqlLiteral(ctx: SoqlLiteralContext) {
        return SoqlLiteralTypeClass.create(ctx);
    }
}
