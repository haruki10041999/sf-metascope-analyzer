import { isSuper, type Super } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class SuperTypeClass extends LwcCommonTypeClass<'super'> {
    private constructor(originalSource: string) {
        super('super', originalSource);
    }

    static create(target: Super, originalSource: string): SuperTypeClass {
        throw new Error('SuperTypeClass.create is not implemented: ' + target.type);
    }
}

export const superTypePair: EvaluatePair<Super, SuperTypeClass> = makeEvaluatePair(
    isSuper,
    (target, originalSource) => SuperTypeClass.create(target, originalSource),
);

export const isSuperType = (target: LwcCommonTypeClass<string>): target is SuperTypeClass =>
    target instanceof SuperTypeClass;
