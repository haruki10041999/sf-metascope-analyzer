import { isSuper, type Super } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class SuperTypeClass extends LwcCommonTypeClass<'super'> {
    private constructor() {
        super('super');
    }

    static create(_target: Super, _originalSource: string): SuperTypeClass {
        return new SuperTypeClass();
    }
}

export const superTypePair: EvaluatePair<Super, SuperTypeClass> = makeEvaluatePair(
    isSuper,
    (target, originalSource) => SuperTypeClass.create(target, originalSource),
);

export const isSuperType = (target: LwcCommonTypeClass<string>): target is SuperTypeClass =>
    target instanceof SuperTypeClass;
