import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isTSInterfaceBody, type TSInterfaceBody } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    visitNodeList,
    getSourceSpan,
} from '../commonVisitor';
import {
    tSTypeElementVisitorEvaluatePairs,
    type TSTypeElementTypeClass,
} from '../tsTypeElementVisitor';

export type TSInterfaceBodyFields = TypeField<'tSInterfaceBody'> & {
    body: TSTypeElementTypeClass[];
};

export class TSInterfaceBodyTypeClass extends LwcCommonTypeClass<
    'tSInterfaceBody',
    TSInterfaceBodyFields
> {
    private constructor(value: FieldsOf<TSInterfaceBodyFields>, sourceSpan: SourceSpan) {
        super('tSInterfaceBody', value, sourceSpan);
    }

    static create(target: TSInterfaceBody, originalSource: string): TSInterfaceBodyTypeClass {
        return new TSInterfaceBodyTypeClass(
            {
                body: visitNodeList(
                    target.body,
                    originalSource,
                    tSTypeElementVisitorEvaluatePairs(),
                    'TSTypeElementVisitor',
                ),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getBody(): TSInterfaceBodyFields['body'] {
        return this.getFields().body;
    }
}

export const tSInterfaceBodyTypePair: EvaluatePair<TSInterfaceBody, TSInterfaceBodyTypeClass> =
    makeEvaluatePair(isTSInterfaceBody, (target, originalSource) =>
        TSInterfaceBodyTypeClass.create(target, originalSource),
    );

export const isTSInterfaceBodyType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is TSInterfaceBodyTypeClass => target instanceof TSInterfaceBodyTypeClass;
