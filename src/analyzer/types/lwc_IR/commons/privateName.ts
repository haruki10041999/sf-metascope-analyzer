import { isPrivateName, type PrivateName } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class PrivateNameTypeClass extends LwcCommonTypeClass<'privateName'> {
    private constructor(originalSource: string) {
        super('privateName', originalSource);
    }

    static create(target: PrivateName, originalSource: string): PrivateNameTypeClass {
        throw new Error('PrivateNameTypeClass.create is not implemented: ' + target.type);
    }
}

export const privateNameTypePair: EvaluatePair<PrivateName, PrivateNameTypeClass> =
    makeEvaluatePair(isPrivateName, (target, originalSource) =>
        PrivateNameTypeClass.create(target, originalSource),
    );

export const isPrivateNameType = (
    target: LwcCommonTypeClass<string>,
): target is PrivateNameTypeClass => target instanceof PrivateNameTypeClass;
