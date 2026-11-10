import { LocationValueContext } from '@apexdevtools/apex-parser';

import { CoordinateValueTypeClass } from './coordinateValue';

import { FieldNameTypeClass } from '../nameVisitor';
import { BoundExpressionTypeClass } from '../expressionVisitor';
import {
    ApexCommonTypeClass,
    createNode,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

/** 項目名・バインド変数、または GEOLOCATION(緯度, 経度) */
export type LocationValueType = TypeField<'locationValue'> &
    (
        | { kind: 'field'; value: FieldNameTypeClass }
        | { kind: 'bind'; value: BoundExpressionTypeClass }
        | {
              kind: 'geolocation';
              latitude: CoordinateValueTypeClass;
              longitude: CoordinateValueTypeClass;
          }
    );

export class LocationValueTypeClass extends ApexCommonTypeClass<
    'locationValue',
    LocationValueType
> {
    private constructor(fields: FieldsOf<LocationValueType>, sourceSpan: SourceSpan) {
        super('locationValue', fields, sourceSpan);
    }

    static create(ctx: LocationValueContext): LocationValueTypeClass {
        return new LocationValueTypeClass(
            LocationValueTypeClass.createFields(ctx),
            getSourceSpan(ctx),
        );
    }

    private static createFields(ctx: LocationValueContext): FieldsOf<LocationValueType> {
        if (ctx.GEOLOCATION()) {
            const coordinates = ctx.coordinateValue_list();
            return {
                kind: 'geolocation',
                latitude: createNode(
                    coordinates[0],
                    (c) => CoordinateValueTypeClass.create(c),
                    'coordinateValue',
                ),
                longitude: createNode(
                    coordinates[1],
                    (c) => CoordinateValueTypeClass.create(c),
                    'coordinateValue',
                ),
            };
        } else if (ctx.fieldName()) {
            return {
                kind: 'field',
                value: createNode(
                    ctx.fieldName(),
                    (c) => FieldNameTypeClass.create(c),
                    'fieldName',
                ),
            };
        }
        return {
            kind: 'bind',
            value: createNode(
                ctx.boundExpression(),
                (c) => BoundExpressionTypeClass.create(c),
                'boundExpression',
            ),
        };
    }

    getKind(): LocationValueType['kind'] {
        return this.getFields().kind;
    }
}

export const isLocationValueType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is LocationValueTypeClass => {
    return isSpicifyApexCommonTypeClass('locationValue', target);
};
