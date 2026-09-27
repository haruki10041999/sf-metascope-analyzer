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
    visitLiteralContext(ctx: LiteralContext): LiteralType {
        return makeLiteralType(ctx);
    }

    visitWhenLiteralContext(ctx: WhenLiteralContext): LiteralType {
        return makeWhenLiteralType(ctx);
    }

    visitSoslLiteralContext(ctx: SoslLiteralContext) {
        return makeSoslLiteralType(ctx);
    }

    visitSoslLiteralAltContext(ctx: SoslLiteralAltContext) {
        return makeSoslLiteralAltType(ctx);
    }
}
