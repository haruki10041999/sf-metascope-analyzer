import {
    ApexParserBaseVisitor,
    ArrayInitializerContext,
    VariableDeclaratorContext,
    VariableDeclaratorsContext,
} from '@apexdevtools/apex-parser';

import { ArrayInitializerType, makeArrayInitializerType } from './arrayInitializer';
import { VariableDeclaratorType, makeVariableDeclaratorType } from './variableDeclarator';
import { VariableDeclaratorsType, makeVariableDeclaratorsType } from './variableDeclarators';

export type VariableType = ArrayInitializerType | VariableDeclaratorType | VariableDeclaratorsType;

export class VariableVisitor extends ApexParserBaseVisitor<VariableType> {
    visitArrayInitializer(ctx: ArrayInitializerContext) {
        return makeArrayInitializerType(ctx);
    }

    visitVariableDeclarator(ctx: VariableDeclaratorContext) {
        return makeVariableDeclaratorType(ctx);
    }

    visitVariableDeclarators(ctx: VariableDeclaratorsContext) {
        return makeVariableDeclaratorsType(ctx);
    }
}
