import { type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isSuper, type Super } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    getSourceSpan,
} from '../commonVisitor';

export type SuperFields = TypeField<'super'>;

export class SuperTypeClass extends LwcCommonTypeClass<'super', SuperFields> {
    private constructor(sourceSpan: SourceSpan) {
        super('super', {}, sourceSpan);
    }

    static create(target: Super, originalSource: string): SuperTypeClass {
        return new SuperTypeClass(getSourceSpan(target, originalSource));
    }
}

export const superTypePair: EvaluatePair<Super, SuperTypeClass> = makeEvaluatePair(
    isSuper,
    (target, originalSource) => SuperTypeClass.create(target, originalSource),
);

export const isSuperType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is SuperTypeClass => target instanceof SuperTypeClass;
