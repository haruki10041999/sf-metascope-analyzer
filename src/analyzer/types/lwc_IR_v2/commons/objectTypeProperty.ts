import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isObjectTypeProperty, type ObjectTypeProperty } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNode,
    getSourceSpan,
} from '../commonVisitor';
import { failIrBuild } from '../buildFailure';
import { flowTypeVisitorEvaluatePairs, type FlowTypeTypeClass } from '../flowTypeVisitor';
import { VarianceTypeClass } from '../flowVisitor/variance';
import { identifierTypePair, type IdentifierTypeClass } from './identifier';
import { numericLiteralTypePair, type NumericLiteralTypeClass } from './numericLiteral';
import { stringLiteralTypePair, type StringLiteralTypeClass } from './stringLiteral';

const objectTypePropertyKeyPairs = lazyPairs(
    () => [identifierTypePair, stringLiteralTypePair, numericLiteralTypePair] as const,
);

/**
 * 種類ごとに書ける修飾子が決まる。
 * - プロパティ (`x?: T`・`+x: T`・`proto x: T`): optional・variance・proto を書ける。proto と static は一緒に書けない
 * - メソッド (`m(): T`)・getter / setter (`get x(): T`): optional・variance・proto は書けない
 */
type ObjectTypePropertyKindFields =
    | {
          kind: 'init';
          method: false;
          optional: boolean;
          variance: VarianceTypeClass | null;
          static: boolean;
          proto: false;
      }
    | {
          kind: 'init';
          method: false;
          optional: boolean;
          variance: VarianceTypeClass | null;
          static: false;
          proto: true;
      }
    | {
          kind: ObjectTypeProperty['kind'];
          method: true;
          optional: false;
          variance: null;
          static: boolean;
          proto: false;
      };

export type ObjectTypePropertyFields = TypeField<'objectTypeProperty'> & {
    key: IdentifierTypeClass | StringLiteralTypeClass | NumericLiteralTypeClass;
    value: FlowTypeTypeClass;
} & ObjectTypePropertyKindFields;

const createKindFields = (
    target: ObjectTypeProperty,
    originalSource: string,
): ObjectTypePropertyKindFields => {
    const invalid = (message: string): never =>
        failIrBuild('TYPE_MISMATCH', target, originalSource, message);
    const variance =
        target.variance == null ? null : VarianceTypeClass.create(target.variance, originalSource);
    if (target.method || target.kind !== 'init') {
        return target.optional || variance != null || target.proto
            ? invalid('メソッド・getter・setter に optional・variance・proto は書けません')
            : {
                  kind: target.kind,
                  method: true,
                  optional: false,
                  variance: null,
                  static: target.static,
                  proto: false,
              };
    }
    if (target.proto) {
        return target.static
            ? invalid('proto と static は一緒に書けません')
            : {
                  kind: 'init',
                  method: false,
                  optional: target.optional,
                  variance,
                  static: false,
                  proto: true,
              };
    }
    return {
        kind: 'init',
        method: false,
        optional: target.optional,
        variance,
        static: target.static,
        proto: false,
    };
};

export class ObjectTypePropertyTypeClass extends LwcCommonTypeClass<
    'objectTypeProperty',
    ObjectTypePropertyFields
> {
    private constructor(value: FieldsOf<ObjectTypePropertyFields>, sourceSpan: SourceSpan) {
        super('objectTypeProperty', value, sourceSpan);
    }

    static create(target: ObjectTypeProperty, originalSource: string): ObjectTypePropertyTypeClass {
        return new ObjectTypePropertyTypeClass(
            {
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
                ...createKindFields(target, originalSource),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getKey(): ObjectTypePropertyFields['key'] {
        return this.getFields().key;
    }

    getValue(): ObjectTypePropertyFields['value'] {
        return this.getFields().value;
    }

    getKind(): ObjectTypePropertyFields['kind'] {
        return this.getFields().kind;
    }

    getStatic(): ObjectTypePropertyFields['static'] {
        return this.getFields().static;
    }

    getProto(): ObjectTypePropertyFields['proto'] {
        return this.getFields().proto;
    }

    getOptional(): ObjectTypePropertyFields['optional'] {
        return this.getFields().optional;
    }

    getVariance(): ObjectTypePropertyFields['variance'] {
        return this.getFields().variance;
    }

    getMethod(): ObjectTypePropertyFields['method'] {
        return this.getFields().method;
    }
}

export const objectTypePropertyTypePair: EvaluatePair<
    ObjectTypeProperty,
    ObjectTypePropertyTypeClass
> = makeEvaluatePair(isObjectTypeProperty, (target, originalSource) =>
    ObjectTypePropertyTypeClass.create(target, originalSource),
);

export const isObjectTypePropertyType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is ObjectTypePropertyTypeClass => target instanceof ObjectTypePropertyTypeClass;
