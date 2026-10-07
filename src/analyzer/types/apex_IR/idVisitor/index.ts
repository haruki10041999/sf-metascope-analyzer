import { IdContext, AnyIdContext, SoqlIdContext, SoslIdContext } from '@apexdevtools/apex-parser';

// 各ファイルより先に base を評価させ、循環 import 時の TDZ を防ぐ
export * from './base';
import type { IdAllTypeClass } from './base';

import { NormalIdTypeClass } from './normal';
import { AnyIdTypeClass } from './anyId';
import { SoqlIdTypeClass } from './soqlId';
import { SoslIdTypeClass } from './soslId';

import { CommonVisitor } from '../commonVisitor';

export { isNormalIdType, NormalIdTypeClass } from './normal';
export { isAnyIdType, AnyIdTypeClass } from './anyId';
export { isSoqlIdType, SoqlIdTypeClass } from './soqlId';
export { isSoslIdType, SoslIdTypeClass } from './soslId';

export class IdVisitor extends CommonVisitor<IdAllTypeClass> {
    visitId(ctx: IdContext) {
        return NormalIdTypeClass.create(ctx);
    }
    visitAnyId(ctx: AnyIdContext) {
        return AnyIdTypeClass.create(ctx);
    }
    visitSoqlId(ctx: SoqlIdContext) {
        return SoqlIdTypeClass.create(ctx);
    }

    visitSoslId(ctx: SoslIdContext) {
        return SoslIdTypeClass.create(ctx);
    }
}
