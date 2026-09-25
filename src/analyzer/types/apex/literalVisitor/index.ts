import {
    ApexParserBaseVisitor,
    LiteralContext,
    WhenLiteralContext,
} from '@apexdevtools/apex-parser';

import { LiteralType as literalType, makeLiteralType } from './literal';
import { WhenLiteralType, makeWhenLiteralType } from './whenLiteral';

export type LiteralType = literalType | WhenLiteralType;

export class LiteralVisitor extends ApexParserBaseVisitor<LiteralType> {
    visitLiteralContext(ctx: LiteralContext): LiteralType {
        return makeLiteralType(ctx);
    }

    visitWhenLiteralContext(ctx: WhenLiteralContext): LiteralType {
        return makeWhenLiteralType(ctx);
    }
}
