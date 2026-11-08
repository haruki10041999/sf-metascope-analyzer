import { isTSEnumBody, type TSEnumBody } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNodeList,
} from '../commonVisitor';
import { tSEnumMemberTypePair, type TSEnumMemberTypeClass } from './tSEnumMember';

const tSEnumBodyMembersPairs = lazyPairs(() => [tSEnumMemberTypePair] as const);

export type TSEnumBodyFields = {
    members: (TSEnumMemberTypeClass | LwcErrorTypeClass)[];
};

export class TSEnumBodyTypeClass extends LwcCommonTypeClass<'tSEnumBody'> {
    private readonly value: TSEnumBodyFields;

    private constructor(value: TSEnumBodyFields) {
        super('tSEnumBody');
        this.value = value;
    }

    static create(target: TSEnumBody, originalSource: string): TSEnumBodyTypeClass {
        return new TSEnumBodyTypeClass({
            members: visitNodeList(
                target.members,
                originalSource,
                tSEnumBodyMembersPairs(),
                'TSEnumBody.members',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): TSEnumBodyFields {
        return this.value;
    }

    getMembers(): TSEnumBodyFields['members'] {
        return this.value.members;
    }
}

export const tSEnumBodyTypePair: EvaluatePair<TSEnumBody, TSEnumBodyTypeClass> = makeEvaluatePair(
    isTSEnumBody,
    (target, originalSource) => TSEnumBodyTypeClass.create(target, originalSource),
);

export const isTSEnumBodyType = (
    target: LwcCommonTypeClass<string>,
): target is TSEnumBodyTypeClass => target instanceof TSEnumBodyTypeClass;
