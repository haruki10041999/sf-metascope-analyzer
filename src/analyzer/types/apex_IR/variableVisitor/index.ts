import {
    ArrayInitializerContext,
    VariableDeclaratorContext,
    VariableDeclaratorsContext,
} from '@apexdevtools/apex-parser';

// 各ファイルより先に base を評価させ、循環 import 時の TDZ を防ぐ
export * from './base';
import type { VariableAllTypeClass } from './base';

import { ArrayInitializerTypeClass } from './arrayInitializer';
import { VariableDeclaratorTypeClass } from './variableDeclarator';
import { VariableDeclaratorsTypeClass } from './variableDeclarators';

import { CommonVisitor } from '../commonVisitor';

export { isArrayInitializerType, ArrayInitializerTypeClass } from './arrayInitializer';
export { isVariableDeclaratorType, VariableDeclaratorTypeClass } from './variableDeclarator';
export { isVariableDeclaratorsType, VariableDeclaratorsTypeClass } from './variableDeclarators';

export class VariableVisitor extends CommonVisitor<VariableAllTypeClass> {
    visitArrayInitializer(ctx: ArrayInitializerContext) {
        return ArrayInitializerTypeClass.create(ctx);
    }

    visitVariableDeclarator(ctx: VariableDeclaratorContext) {
        return VariableDeclaratorTypeClass.create(ctx);
    }

    visitVariableDeclarators(ctx: VariableDeclaratorsContext) {
        return VariableDeclaratorsTypeClass.create(ctx);
    }
}
