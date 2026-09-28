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

import { LiteralType as literalType, makeLiteralType } from './literal';
import { WhenLiteralType, makeWhenLiteralType } from './whenLiteral';
import { SoslLiteralType, makeSoslLiteralType } from './soslLiteral';
import { SoslLiteralAltType, makeSoslLiteralAltType } from './soslLiteralAlt';
import { SignedIntegerType, makeSignedIntegerType } from './signedInteger';
import { SignedNumberType, makeSignedNumberType } from './signedNumber';
import { SoqlLiteralType, makeSoqlLiteralType } from './soqlLiteral';

export type LiteralType =
    | literalType
    | WhenLiteralType
    | SoslLiteralType
    | SoslLiteralAltType
    | SignedIntegerType
    | SignedNumberType
    | SoqlLiteralType;

export class LiteralVisitor extends ApexParserBaseVisitor<LiteralType> {
    visitLiteral(ctx: LiteralContext): LiteralType {
        return makeLiteralType(ctx);
    }

    visitWhenLiteral(ctx: WhenLiteralContext) {
        return makeWhenLiteralType(ctx);
    }

    visitSoslLiteral(ctx: SoslLiteralContext) {
        return makeSoslLiteralType(ctx);
    }

    visitSoslLiteralAlt(ctx: SoslLiteralAltContext) {
        return makeSoslLiteralAltType(ctx);
    }

    visitSignedInteger(ctx: SignedIntegerContext) {
        return makeSignedIntegerType(ctx);
    }

    visitSignedNumber(ctx: SignedNumberContext) {
        return makeSignedNumberType(ctx);
    }

    visitSoqlLiteral(ctx: SoqlLiteralContext) {
        return makeSoqlLiteralType(ctx);
    }
}
