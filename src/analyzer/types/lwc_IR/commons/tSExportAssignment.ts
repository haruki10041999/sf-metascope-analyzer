import { isTSExportAssignment, type TSExportAssignment } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class TSExportAssignmentTypeClass extends LwcCommonTypeClass<'tSExportAssignment'> {
    private constructor(originalSource: string) {
        super('tSExportAssignment', originalSource);
    }

    static create(target: TSExportAssignment, originalSource: string): TSExportAssignmentTypeClass {
        throw new Error('TSExportAssignmentTypeClass.create is not implemented: ' + target.type);
    }
}

export const tSExportAssignmentTypePair: EvaluatePair<
    TSExportAssignment,
    TSExportAssignmentTypeClass
> = makeEvaluatePair(isTSExportAssignment, (target, originalSource) =>
    TSExportAssignmentTypeClass.create(target, originalSource),
);

export const isTSExportAssignmentType = (
    target: LwcCommonTypeClass<string>,
): target is TSExportAssignmentTypeClass => target instanceof TSExportAssignmentTypeClass;
