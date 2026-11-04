import { isSpreadProperty, type Node, type SpreadProperty } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

const isSpreadPropertyNode = (target: Node | null | undefined): target is SpreadProperty =>
    isSpreadProperty(target);

export class SpreadPropertyTypeClass extends LwcCommonTypeClass<'spreadProperty'> {
    private constructor(originalSource: string) {
        super('spreadProperty', originalSource);
    }

    static create(target: SpreadProperty, originalSource: string): SpreadPropertyTypeClass {
        throw new Error('SpreadPropertyTypeClass.create is not implemented: ' + target.type);
    }
}

export const spreadPropertyTypePair: EvaluatePair<SpreadProperty, SpreadPropertyTypeClass> =
    makeEvaluatePair(isSpreadPropertyNode, (target, originalSource) =>
        SpreadPropertyTypeClass.create(target, originalSource),
    );

export const isSpreadPropertyType = (
    target: LwcCommonTypeClass<string>,
): target is SpreadPropertyTypeClass => target instanceof SpreadPropertyTypeClass;
