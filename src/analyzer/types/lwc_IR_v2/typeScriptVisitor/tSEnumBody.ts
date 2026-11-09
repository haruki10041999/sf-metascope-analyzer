import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isTSEnumBody, type TSEnumBody } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    getSourceSpan,
} from '../commonVisitor';
import { TSEnumMemberTypeClass } from './tSEnumMember';

export type TSEnumBodyFields = TypeField<'tSEnumBody'> & {
    members: TSEnumMemberTypeClass[];
};

export class TSEnumBodyTypeClass extends LwcCommonTypeClass<'tSEnumBody', TSEnumBodyFields> {
    private constructor(value: FieldsOf<TSEnumBodyFields>, sourceSpan: SourceSpan) {
        super('tSEnumBody', value, sourceSpan);
    }

    static create(target: TSEnumBody, originalSource: string): TSEnumBodyTypeClass {
        return new TSEnumBodyTypeClass(
            {
                members: target.members.map((child) =>
                    TSEnumMemberTypeClass.create(child, originalSource),
                ),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getMembers(): TSEnumBodyFields['members'] {
        return this.getFields().members;
    }
}

export const tSEnumBodyTypePair: EvaluatePair<TSEnumBody, TSEnumBodyTypeClass> = makeEvaluatePair(
    isTSEnumBody,
    (target, originalSource) => TSEnumBodyTypeClass.create(target, originalSource),
);

export const isTSEnumBodyType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is TSEnumBodyTypeClass => target instanceof TSEnumBodyTypeClass;
