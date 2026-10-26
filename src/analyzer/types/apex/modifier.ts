import typia from 'typia';

import {
    ErrorJson,
    isErrorJson,
    JsonType,
    makeJsonType,
    convertValue,
    ConvertExcludeError,
    ConvertType,
} from './commons';

import {
    ModifierType,
    AnnotationType,
    ElementValueType,
    ElementValuePairsType,
    ErrorType,
} from './converter';

export type AnnotationArgJson = {
    key?: string;
    value: string;
    valueType: string;
};

export type AnnotationJson = JsonType<'modifier'> & {
    type: 'annotation';
    name: string;
    arg?: AnnotationArgJson | AnnotationArgJson[];
};

export const isAnnotationJson = typia.createIs<AnnotationJson>();

export type ModifierJson = JsonType<'modifier'> & {
    type: 'modifier';
    name:
        | 'GLOBAL'
        | 'PUBLIC'
        | 'PROTECTED'
        | 'PRIVATE'
        | 'TRANSIENT'
        | 'STATIC'
        | 'ABSTRACT'
        | 'FINAL'
        | 'WEBSERVICE'
        | 'OVERRIDE'
        | 'VIRTUAL'
        | 'TESTMETHOD'
        | 'WITH_SHARING'
        | 'WITHOUT_SHARING'
        | 'INHERITED_SHARING';
};

export const isModifierJson = typia.createIs<ModifierJson>();

const makeAnnotationJson = (
    kind: 'modifier',
    target: ConvertExcludeError<AnnotationType>,
    records: Record<string, string[]>,
): AnnotationJson => {
    const name = target.value.value;

    const annotationJson: AnnotationJson = makeJsonType(kind, records, {
        type: 'annotation',
        name: name,
    });

    const arg = target.param ? target.param : null;

    if (arg) {
        if (arg.type === 'elementValue') {
            const literalValue = arg.value.value;
            const literalValueType = arg.value.valueType;
            annotationJson.arg = {
                value: literalValue,
                valueType: literalValueType,
            };
            return annotationJson;
        } else {
            const annotationArgs: AnnotationArgJson[] = [];
            const pairList = arg.value;
            pairList.forEach((pair) => {
                const key = pair.left.value;
                const literalValue = pair.right.value.value;
                const valueType = pair.right.value.valueType;

                annotationArgs.push({
                    key: key,
                    value: literalValue,
                    valueType: valueType,
                });
            });
            annotationJson.arg = annotationArgs;
            return annotationJson;
        }
    }

    return annotationJson;
};

export const makeModifierJson = (
    target: ConvertType<ModifierType>,
    targetRecords?: Record<string, string[]>,
): ModifierJson | AnnotationJson | ErrorJson => {
    return convertValue<'modifier', 'modifier', ModifierType, ModifierJson | AnnotationJson>(
        ['modifier'],
        target,
        'modifier',
        (kind, target, targetRecords, errorJson) => {
            const modifier = target!.value;
            if (typeof modifier === 'string') {
                return makeJsonType(kind, targetRecords, {
                    type: 'modifier',
                    name: modifier,
                });
            }

            if (modifier.type === 'annotation') {
                return makeAnnotationJson(kind, modifier, targetRecords);
            }

            return errorJson;
        },
        targetRecords,
    );
};

