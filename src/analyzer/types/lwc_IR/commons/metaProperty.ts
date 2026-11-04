import { isMetaProperty, type MetaProperty } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class MetaPropertyTypeClass extends LwcCommonTypeClass<'metaProperty'> {
    private constructor(originalSource: string) {
        super('metaProperty', originalSource);
    }

    static create(target: MetaProperty, originalSource: string): MetaPropertyTypeClass {
        throw new Error('MetaPropertyTypeClass.create is not implemented: ' + target.type);
    }
}

export const metaPropertyTypePair: EvaluatePair<MetaProperty, MetaPropertyTypeClass> =
    makeEvaluatePair(isMetaProperty, (target, originalSource) =>
        MetaPropertyTypeClass.create(target, originalSource),
    );

export const isMetaPropertyType = (
    target: LwcCommonTypeClass<string>,
): target is MetaPropertyTypeClass => target instanceof MetaPropertyTypeClass;
