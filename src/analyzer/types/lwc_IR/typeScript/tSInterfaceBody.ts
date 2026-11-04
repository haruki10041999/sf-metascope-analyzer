import { isTSInterfaceBody, type TSInterfaceBody } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class TSInterfaceBodyTypeClass extends LwcCommonTypeClass<'tSInterfaceBody'> {
    private constructor(originalSource: string) {
        super('tSInterfaceBody', originalSource);
    }

    static create(target: TSInterfaceBody, originalSource: string): TSInterfaceBodyTypeClass {
        throw new Error('TSInterfaceBodyTypeClass.create is not implemented: ' + target.type);
    }
}

export const tSInterfaceBodyTypePair: EvaluatePair<TSInterfaceBody, TSInterfaceBodyTypeClass> =
    makeEvaluatePair(isTSInterfaceBody, (target, originalSource) =>
        TSInterfaceBodyTypeClass.create(target, originalSource),
    );

export const isTSInterfaceBodyType = (
    target: LwcCommonTypeClass<string>,
): target is TSInterfaceBodyTypeClass => target instanceof TSInterfaceBodyTypeClass;
