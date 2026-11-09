import { type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isTSThisType, type TSThisType } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    getSourceSpan,
} from '../commonVisitor';

export type TSThisTypeFields = TypeField<'tSThisType'>;

export class TSThisTypeTypeClass extends LwcCommonTypeClass<'tSThisType', TSThisTypeFields> {
    private constructor(sourceSpan: SourceSpan) {
        super('tSThisType', {}, sourceSpan);
    }

    static create(target: TSThisType, originalSource: string): TSThisTypeTypeClass {
        return new TSThisTypeTypeClass(getSourceSpan(target, originalSource));
    }
}

export const tSThisTypeTypePair: EvaluatePair<TSThisType, TSThisTypeTypeClass> = makeEvaluatePair(
    isTSThisType,
    (target, originalSource) => TSThisTypeTypeClass.create(target, originalSource),
);

export const isTSThisTypeType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is TSThisTypeTypeClass => target instanceof TSThisTypeTypeClass;
