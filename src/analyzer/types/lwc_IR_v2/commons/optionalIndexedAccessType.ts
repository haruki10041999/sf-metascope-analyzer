import { isOptionalIndexedAccessType, type OptionalIndexedAccessType } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    makeEvaluatePair,
    visitNode,
} from '../commonVisitor';
import { flowTypeVisitorEvaluatePairs, type FlowTypeTypeClass } from '../flowTypeVisitor';

export type OptionalIndexedAccessTypeFields = {
    objectType: FlowTypeTypeClass | LwcErrorTypeClass;
    indexType: FlowTypeTypeClass | LwcErrorTypeClass;
    optional: OptionalIndexedAccessType['optional'];
};

export class OptionalIndexedAccessTypeTypeClass extends LwcCommonTypeClass<'optionalIndexedAccessType'> {
    private readonly value: OptionalIndexedAccessTypeFields;

    private constructor(value: OptionalIndexedAccessTypeFields) {
        super('optionalIndexedAccessType');
        this.value = value;
    }

    static create(
        target: OptionalIndexedAccessType,
        originalSource: string,
    ): OptionalIndexedAccessTypeTypeClass {
        return new OptionalIndexedAccessTypeTypeClass({
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
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): OptionalIndexedAccessTypeFields {
        return this.value;
    }

    getObjectType(): OptionalIndexedAccessTypeFields['objectType'] {
        return this.value.objectType;
    }

    getIndexType(): OptionalIndexedAccessTypeFields['indexType'] {
        return this.value.indexType;
    }

    getOptional(): OptionalIndexedAccessTypeFields['optional'] {
        return this.value.optional;
    }
}

export const optionalIndexedAccessTypeTypePair: EvaluatePair<
    OptionalIndexedAccessType,
    OptionalIndexedAccessTypeTypeClass
> = makeEvaluatePair(isOptionalIndexedAccessType, (target, originalSource) =>
    OptionalIndexedAccessTypeTypeClass.create(target, originalSource),
);

export const isOptionalIndexedAccessTypeType = (
    target: LwcCommonTypeClass<string>,
): target is OptionalIndexedAccessTypeTypeClass =>
    target instanceof OptionalIndexedAccessTypeTypeClass;
