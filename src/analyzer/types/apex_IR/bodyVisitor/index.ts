import { ClassBodyContext, InterfaceBodyContext } from '@apexdevtools/apex-parser';

import { ClassBodyType, makeClassBodyType } from './classBody';
import { InterfaceBodyTypeClass } from './interfaceBody';

import { ErrorTypeClass, ContextTypeClass, CommonTypeClass, CommonVisitor } from '../commonVisitor';

export { isInterfaceBodyType, InterfaceBodyTypeClass } from './interfaceBody';

export class BodyTypeClass<T> extends ContextTypeClass<T> {
    constructor(type: string, value: T | null, errorClasses: Record<string, ErrorTypeClass>) {
        super(type, value, errorClasses);
    }
}

export const isBodyTypeAll = (target: CommonTypeClass): target is BodyTypeClass<unknown> => {
    return target instanceof BodyTypeClass;
};

export class BodyVisitor extends CommonVisitor<BodyTypeClass<unknown>> {
    visitClassBody(ctx: ClassBodyContext) {
        console.log('解析を開始します。' + 'ClassBodyContext:  ' + ctx.getText());
        const result = makeClassBodyType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'ClassBodyContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitInterfaceBody(ctx: InterfaceBodyContext) {
        return InterfaceBodyTypeClass.create(ctx);
    }
}
