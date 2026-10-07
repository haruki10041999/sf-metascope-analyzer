import { ClassBodyContext, InterfaceBodyContext } from '@apexdevtools/apex-parser';

// 各ファイルより先に base を評価させ、循環 import 時の TDZ を防ぐ
export * from './base';
import type { BodyTypeClass } from './base';

import { ClassBodyTypeClass } from './classBody';
import { InterfaceBodyTypeClass } from './interfaceBody';

import { CommonVisitor } from '../commonVisitor';

export { isClassBodyType, ClassBodyTypeClass } from './classBody';
export { isInterfaceBodyType, InterfaceBodyTypeClass } from './interfaceBody';

export class BodyVisitor extends CommonVisitor<BodyTypeClass<unknown>> {
    visitClassBody(ctx: ClassBodyContext) {
        return ClassBodyTypeClass.create(ctx);
    }

    visitInterfaceBody(ctx: InterfaceBodyContext) {
        return InterfaceBodyTypeClass.create(ctx);
    }
}
