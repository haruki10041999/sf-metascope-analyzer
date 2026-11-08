import { isObjectTypeProperty, type ObjectTypeProperty } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNode,
    visitOptionalNode,
} from '../commonVisitor';
import { flowTypeVisitorEvaluatePairs, type FlowTypeTypeClass } from '../flowTypeVisitor';
import { varianceTypePair, type VarianceTypeClass } from '../flowVisitor/variance';
import { identifierTypePair, type IdentifierTypeClass } from './identifier';
import { numericLiteralTypePair, type NumericLiteralTypeClass } from './numericLiteral';
import { stringLiteralTypePair, type StringLiteralTypeClass } from './stringLiteral';

const objectTypePropertyKeyPairs = lazyPairs(
    () => [identifierTypePair, stringLiteralTypePair, numericLiteralTypePair] as const,
);
const objectTypePropertyVariancePairs = lazyPairs(() => [varianceTypePair] as const);

export type ObjectTypePropertyFields = {
    key: IdentifierTypeClass | StringLiteralTypeClass | NumericLiteralTypeClass | LwcErrorTypeClass;
    value: FlowTypeTypeClass | LwcErrorTypeClass;
    kind: ObjectTypeProperty['kind'];
    static: ObjectTypeProperty['static'];
    proto: ObjectTypeProperty['proto'];
    optional: ObjectTypeProperty['optional'];
    variance: VarianceTypeClass | LwcErrorTypeClass | null;
    method: ObjectTypeProperty['method'];
};

export class ObjectTypePropertyTypeClass extends LwcCommonTypeClass<'objectTypeProperty'> {
    private readonly value: ObjectTypePropertyFields;

    private constructor(value: ObjectTypePropertyFields) {
        super('objectTypeProperty');
        this.value = value;
    }

    static create(target: ObjectTypeProperty, originalSource: string): ObjectTypePropertyTypeClass {
        return new ObjectTypePropertyTypeClass({
            key: visitNode(
                target.key,
                originalSource,
                objectTypePropertyKeyPairs(),
                'ObjectTypeProperty.key',
            ),
            value: visitNode(
                target.value,
                originalSource,
                flowTypeVisitorEvaluatePairs(),
                'FlowTypeVisitor',
            ),
            kind: target.kind,
            static: target.static,
            proto: target.proto,
            optional: target.optional,
            variance: visitOptionalNode(
                target.variance,
                originalSource,
                objectTypePropertyVariancePairs(),
                'ObjectTypeProperty.variance',
            ),
            method: target.method,
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): ObjectTypePropertyFields {
        return this.value;
    }

    getKey(): ObjectTypePropertyFields['key'] {
        return this.value.key;
    }

    getValue(): ObjectTypePropertyFields['value'] {
        return this.value.value;
    }

    getKind(): ObjectTypePropertyFields['kind'] {
        return this.value.kind;
    }

    getStatic(): ObjectTypePropertyFields['static'] {
        return this.value.static;
    }

    getProto(): ObjectTypePropertyFields['proto'] {
        return this.value.proto;
    }

    getOptional(): ObjectTypePropertyFields['optional'] {
        return this.value.optional;
    }

    getVariance(): ObjectTypePropertyFields['variance'] {
        return this.value.variance;
    }

    getMethod(): ObjectTypePropertyFields['method'] {
        return this.value.method;
    }
}

export const objectTypePropertyTypePair: EvaluatePair<
    ObjectTypeProperty,
    ObjectTypePropertyTypeClass
> = makeEvaluatePair(isObjectTypeProperty, (target, originalSource) =>
    ObjectTypePropertyTypeClass.create(target, originalSource),
);

export const isObjectTypePropertyType = (
    target: LwcCommonTypeClass<string>,
): target is ObjectTypePropertyTypeClass => target instanceof ObjectTypePropertyTypeClass;
