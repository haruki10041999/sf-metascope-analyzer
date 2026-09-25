import {
    ApexParserBaseVisitor,
    ArgumentsContext,
    TypeArgumentsContext,
} from '@apexdevtools/apex-parser';

import { ArgumentsType as argumentsType, makeArgumentsType } from './arguments';
import { TypeArgumentsType, makeTypeArgumentsType } from './typeArguments';

export type ArgumentsType = argumentsType | TypeArgumentsType;

export class ArgumentsVisitor extends ApexParserBaseVisitor<ArgumentsType> {
    visitArgumentsContext(ctx: ArgumentsContext): ArgumentsType {
        return makeArgumentsType(ctx);
    }

    visitTypeArgumentsContext(ctx: TypeArgumentsContext): ArgumentsType {
        return makeTypeArgumentsType(ctx);
    }
}
