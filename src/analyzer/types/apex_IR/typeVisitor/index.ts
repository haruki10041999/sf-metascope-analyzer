import { ArraySubscriptsContext, TypeRefContext } from '@apexdevtools/apex-parser';

// 各ファイルより先に base を評価させ、循環 import 時の TDZ を防ぐ
export * from './base';
import type { TypeTypeClass } from './base';

import { ArraySubscriptsTypeClass } from './arraySubscripts';
import { TypeRefTypeClass } from './typeRef';

import { CommonVisitor } from '../commonVisitor';

export { isArraySubscriptsType, ArraySubscriptsTypeClass } from './arraySubscripts';
export { isTypeRefType, TypeRefTypeClass } from './typeRef';

export class TypeVisitor extends CommonVisitor<TypeTypeClass<unknown>> {
    visitArraySubscripts(ctx: ArraySubscriptsContext) {
        return ArraySubscriptsTypeClass.create(ctx);
    }

    visitTypeRef(ctx: TypeRefContext) {
        return TypeRefTypeClass.create(ctx);
    }
}
