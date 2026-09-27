import {
    ApexParserBaseVisitor,
    LiteralContext,
    WhenLiteralContext,
    SoslLiteralContext,
    SoslLiteralAltContext,
} from '@apexdevtools/apex-parser';

import { LiteralType as literalType, makeLiteralType } from './literal';
import { WhenLiteralType, makeWhenLiteralType } from './whenLiteral';
import { SoslLiteralType, makeSoslLiteralType } from './soslLiteral';
import { SoslLiteralAltType, makeSoslLiteralAltType } from './soslLiteralAlt';

export type LiteralType = literalType | WhenLiteralType | SoslLiteralType;

export class LiteralVisitor extends ApexParserBaseVisitor<LiteralType> {
    visitLiteral(ctx: LiteralContext): LiteralType {
        return makeLiteralType(ctx);
    }

    visitWhenLiteral(ctx: WhenLiteralContext): LiteralType {
        return makeWhenLiteralType(ctx);
    }

    visitSoslLiteral(ctx: SoslLiteralContext) {
        return makeSoslLiteralType(ctx);
    }

    visitSoslLiteralAlt(ctx: SoslLiteralAltContext) {
        return makeSoslLiteralAltType(ctx);
    }
}
