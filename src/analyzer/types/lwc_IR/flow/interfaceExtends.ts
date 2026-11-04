import { isInterfaceExtends, type InterfaceExtends } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class InterfaceExtendsTypeClass extends LwcCommonTypeClass<'interfaceExtends'> {
    private constructor(originalSource: string) {
        super('interfaceExtends', originalSource);
    }

    static create(target: InterfaceExtends, originalSource: string): InterfaceExtendsTypeClass {
        throw new Error('InterfaceExtendsTypeClass.create is not implemented: ' + target.type);
    }
}

export const interfaceExtendsTypePair: EvaluatePair<InterfaceExtends, InterfaceExtendsTypeClass> =
    makeEvaluatePair(isInterfaceExtends, (target, originalSource) =>
        InterfaceExtendsTypeClass.create(target, originalSource),
    );

export const isInterfaceExtendsType = (
    target: LwcCommonTypeClass<string>,
): target is InterfaceExtendsTypeClass => target instanceof InterfaceExtendsTypeClass;
