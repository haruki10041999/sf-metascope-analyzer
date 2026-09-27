import {
    ApexParserBaseVisitor,
    ArgumentsContext,
    TypeArgumentsContext,
} from '@apexdevtools/apex-parser';

import { ArgumentsType as argumentsType, makeArgumentsType } from './arguments';
import { TypeArgumentsType, makeTypeArgumentsType } from './typeArguments';

export type ArgumentsType = argumentsType | TypeArgumentsType;

export class ArgumentsVisitor extends ApexParserBaseVisitor<ArgumentsType> {
    visitArguments(ctx: ArgumentsContext): ArgumentsType {
        return makeArgumentsType(ctx);
    }

    visitTypeArguments(ctx: TypeArgumentsContext): ArgumentsType {
        return makeTypeArgumentsType(ctx);
    }
}
