import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isOptionalIndexedAccessType, type OptionalIndexedAccessType } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    visitNode,
    getSourceSpan,
} from '../commonVisitor';
import { flowTypeVisitorEvaluatePairs, type FlowTypeTypeClass } from '../flowTypeVisitor';

export type OptionalIndexedAccessTypeFields = TypeField<'optionalIndexedAccessType'> & {
    objectType: FlowTypeTypeClass;
    indexType: FlowTypeTypeClass;
    optional: OptionalIndexedAccessType['optional'];
};

export class OptionalIndexedAccessTypeTypeClass extends LwcCommonTypeClass<
    'optionalIndexedAccessType',
    OptionalIndexedAccessTypeFields
> {
    private constructor(value: FieldsOf<OptionalIndexedAccessTypeFields>, sourceSpan: SourceSpan) {
        super('optionalIndexedAccessType', value, sourceSpan);
    }

    static create(
        target: OptionalIndexedAccessType,
        originalSource: string,
    ): OptionalIndexedAccessTypeTypeClass {
        return new OptionalIndexedAccessTypeTypeClass(
            {
                objectType: visitNode(
                    target.objectType,
                    originalSource,
                    flowTypeVisitorEvaluatePairs(),
                    'FlowTypeVisitor',
                ),
                indexType: visitNode(
                    target.indexType,
                    originalSource,
                    flowTypeVisitorEvaluatePairs(),
                    'FlowTypeVisitor',
                ),
                optional: target.optional,
            },
            getSourceSpan(target, originalSource),
        );
    }

    getObjectType(): OptionalIndexedAccessTypeFields['objectType'] {
        return this.getFields().objectType;
    }

    getIndexType(): OptionalIndexedAccessTypeFields['indexType'] {
        return this.getFields().indexType;
    }

    getOptional(): OptionalIndexedAccessTypeFields['optional'] {
        return this.getFields().optional;
    }
}

export const optionalIndexedAccessTypeTypePair: EvaluatePair<
    OptionalIndexedAccessType,
    OptionalIndexedAccessTypeTypeClass
> = makeEvaluatePair(isOptionalIndexedAccessType, (target, originalSource) =>
    OptionalIndexedAccessTypeTypeClass.create(target, originalSource),
);

export const isOptionalIndexedAccessTypeType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is OptionalIndexedAccessTypeTypeClass =>
    target instanceof OptionalIndexedAccessTypeTypeClass;
