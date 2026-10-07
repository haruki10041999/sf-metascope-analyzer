import { ArgumentsContext, TypeArgumentsContext } from '@apexdevtools/apex-parser';

// 各ファイルより先に base を評価させ、循環 import 時の TDZ を防ぐ
export * from './base';
import type { ArgumentsTypeClass } from './base';

import { NormalArgumentsTypeClass } from './normal';
import { TypeArgumentsTypeClass } from './typeArguments';

import { CommonVisitor } from '../commonVisitor';

export { isNormalArgumentsType, NormalArgumentsTypeClass } from './normal';
export { isTypeArgumentsType, TypeArgumentsTypeClass } from './typeArguments';

export class ArgumentsVisitor extends CommonVisitor<ArgumentsTypeClass<unknown>> {
    visitArguments(ctx: ArgumentsContext) {
        return NormalArgumentsTypeClass.create(ctx);
    }

    visitTypeArguments(ctx: TypeArgumentsContext) {
        return TypeArgumentsTypeClass.create(ctx);
    }
}
