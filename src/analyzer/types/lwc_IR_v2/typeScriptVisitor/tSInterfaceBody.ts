import { isTSInterfaceBody, type TSInterfaceBody } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    makeEvaluatePair,
    visitNodeList,
} from '../commonVisitor';
import {
    tSTypeElementVisitorEvaluatePairs,
    type TSTypeElementTypeClass,
} from '../tsTypeElementVisitor';

export type TSInterfaceBodyFields = {
    body: (TSTypeElementTypeClass | LwcErrorTypeClass)[];
};

export class TSInterfaceBodyTypeClass extends LwcCommonTypeClass<'tSInterfaceBody'> {
    private readonly value: TSInterfaceBodyFields;

    private constructor(value: TSInterfaceBodyFields) {
        super('tSInterfaceBody');
        this.value = value;
    }

    static create(target: TSInterfaceBody, originalSource: string): TSInterfaceBodyTypeClass {
        return new TSInterfaceBodyTypeClass({
            body: visitNodeList(
                target.body,
                originalSource,
                tSTypeElementVisitorEvaluatePairs(),
                'TSTypeElementVisitor',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): TSInterfaceBodyFields {
        return this.value;
    }

    getBody(): TSInterfaceBodyFields['body'] {
        return this.value.body;
    }
}

export const tSInterfaceBodyTypePair: EvaluatePair<TSInterfaceBody, TSInterfaceBodyTypeClass> =
    makeEvaluatePair(isTSInterfaceBody, (target, originalSource) =>
        TSInterfaceBodyTypeClass.create(target, originalSource),
    );

export const isTSInterfaceBodyType = (
    target: LwcCommonTypeClass<string>,
): target is TSInterfaceBodyTypeClass => target instanceof TSInterfaceBodyTypeClass;
