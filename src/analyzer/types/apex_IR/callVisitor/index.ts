import { MethodCallContext, DotMethodCallContext } from '@apexdevtools/apex-parser';

// 各ファイルより先に base を評価させ、循環 import 時の TDZ を防ぐ
export * from './base';
import type { CallTypeClass } from './base';

import { MethodCallTypeClass } from './methodCall';
import { DotMethodCallTypeClass } from './dotMethodCall';

import { CommonVisitor } from '../commonVisitor';

export { isMethodCallType, MethodCallTypeClass } from './methodCall';
export { isDotMethodCallType, DotMethodCallTypeClass } from './dotMethodCall';

export class CallVisitor extends CommonVisitor<CallTypeClass<unknown, unknown>> {
    visitMethodCall(ctx: MethodCallContext) {
        return MethodCallTypeClass.create(ctx);
    }

    visitDotMethodCall(ctx: DotMethodCallContext) {
        return DotMethodCallTypeClass.create(ctx);
    }
}

