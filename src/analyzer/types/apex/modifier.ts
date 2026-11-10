import typia from 'typia';

import { JsonType } from '../commons';
import type { AnnotationTypeClass, ElementValueTypeClass, ModifierTypeClass } from '../apex_IR';

import { makeNodeJson } from './commons/node';

export type AnnotationArgJson = {
    key?: string;
    value: string;
    valueType: string;
};

export type AnnotationJson = JsonType<'annotation'> & {
    name: string;
    arg?: AnnotationArgJson | AnnotationArgJson[];
};

export const isAnnotationJson = typia.createIs<AnnotationJson>();

export type ModifierJson = JsonType<'modifier'> & {
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

export type ModifiersJson = {
    access?: ModifierJson[];
    declaration?: ModifierJson[];
    webService?: ModifierJson[];
    test?: ModifierJson[];
    sharing?: ModifierJson[];
    other?: ModifierJson[];
    lwcAnnotation?: AnnotationJson[];
    flowAnnotation?: AnnotationJson[];
    asyncAnnotation?: AnnotationJson[];
    testAnnotation?: AnnotationJson[];
    restAnnotation?: AnnotationJson[];
    visualforceAnnotation?: AnnotationJson[];
    accessAnnotation?: AnnotationJson[];
    serializeAnnotation?: AnnotationJson[];
    executionAnnotation?: AnnotationJson[];
    compatibilityAnnotation?: AnnotationJson[];
    otherAnnotation?: AnnotationJson[];
};

export const isModifiersJson = typia.createIs<ModifiersJson>();

const isAccessModifier = (value: string): boolean =>
    ['PUBLIC', 'PRIVATE', 'PROTECTED', 'GLOBAL'].includes(value.toUpperCase());

const isDeclarationModifier = (value: string): boolean =>
    ['STATIC', 'FINAL', 'ABSTRACT', 'VIRTUAL', 'OVERRIDE'].includes(value.toUpperCase());

const isWebServiceModifier = (value: string): boolean => value.toUpperCase() === 'WEBSERVICE';

const isTestModifier = (value: string): boolean => value.toUpperCase() === 'TESTMETHOD';

const isSharingModifier = (value: string): boolean =>
    ['WITH_SHARING', 'WITHOUT_SHARING', 'INHERITED_SHARING'].includes(value.toUpperCase());

const isLWCAnnotation = (value: string): boolean => value.toUpperCase() === 'AURAENABLED';

const isFlowAnnotation = (value: string): boolean =>
    ['INVOCABLEMETHOD', 'INVOCABLEVARIABLE'].includes(value.toUpperCase());

const isAsyncAnnotation = (value: string): boolean => value.toUpperCase() === 'FUTURE';

const isTestAnnotation = (value: string): boolean =>
    ['ISTEST', 'TESTSETUP', 'TESTVISIBLE'].includes(value.toUpperCase());

const isRestAnnotation = (value: string): boolean =>
    ['RESTRESOURCE', 'HTTPDELETE', 'HTTPGET', 'HTTPPATCH', 'HTTPPOST', 'HTTPPUT'].includes(
        value.toUpperCase(),
    );

const isVisualforceAnnotation = (value: string): boolean => value.toUpperCase() === 'REMOTEACTION';

const isAccessAnnotation = (value: string): boolean =>
    value.toUpperCase() === 'NAMESPACEACCESSIBLE';

const isSerializationAnnotation = (value: string): boolean => value.toUpperCase() === 'JSONACCESS';

const isExecutionAnnotation = (value: string): boolean => value.toUpperCase() === 'READONLY';

const isCompatibilityAnnotation = (value: string): boolean =>
    ['DEPRECATED', 'SUPPRESSWARNINGS'].includes(value.toUpperCase());

const makeAnnotationArgJson = (target: ElementValueTypeClass, key?: string): AnnotationArgJson => {
    const { value, valueType } = target.getFields().value.getFields();
    return { ...(key !== undefined ? { key: key } : {}), value: value, valueType: valueType };
};

// アノテーションのキーは、それを持つ修飾子のノードのキーにする (v1 と同じ)
const makeAnnotationJson = (
    target: AnnotationTypeClass,
    modifier: ModifierTypeClass,
): AnnotationJson => {
    const { name, param } = target.getFields();
    const annotationJson = makeNodeJson<AnnotationJson>('annotation', modifier, {
        name: name.getFields().value,
    });

    if (param) {
        annotationJson.arg =
            param.kind === 'elementValue'
                ? makeAnnotationArgJson(param)
                : param
                      .getFields()
                      .value.map((pair) =>
                          makeAnnotationArgJson(
                              pair.getFields().right,
                              pair.getFields().left.getFields().value,
                          ),
                      );
    }

    return annotationJson;
};

export const makeModifierJson = (target: ModifierTypeClass): ModifierJson | AnnotationJson => {
    const fields = target.getFields();
    switch (fields.kind) {
        case 'keyword':
            return makeNodeJson<ModifierJson>('modifier', target, { name: fields.keyword });
        case 'annotation':
            return makeAnnotationJson(fields.annotation, target);
    }
};

export const makeModifiersJson = (targets: readonly ModifierTypeClass[]): ModifiersJson => {
    const modifiers: Record<string, ModifierJson[]> = {};
    const annotations: Record<string, AnnotationJson[]> = {};
    const addModifier = (attribute: string, value: ModifierJson) => {
        (modifiers[attribute] ??= []).push(value);
    };
    const addAnnotation = (attribute: string, value: AnnotationJson) => {
        (annotations[attribute] ??= []).push(value);
    };

    targets.forEach((target) => {
        const result = makeModifierJson(target);

        // 判別は kind で行う（isModifierJson は name を既知の修飾子に限るため、未知の修飾子を取りこぼす）
        if (result.kind === 'modifier') {
            if (isAccessModifier(result.name)) {
                addModifier('access', result);
            } else if (isDeclarationModifier(result.name)) {
                addModifier('declaration', result);
            } else if (isWebServiceModifier(result.name)) {
                addModifier('webService', result);
            } else if (isTestModifier(result.name)) {
                addModifier('test', result);
            } else if (isSharingModifier(result.name)) {
                addModifier('sharing', result);
            } else {
                // TRANSIENT と、どの分類にも当たらない修飾子（捨てずに残す）
                addModifier('other', result);
            }
            return;
        }

        if (isLWCAnnotation(result.name)) {
            addAnnotation('lwcAnnotation', result);
        } else if (isFlowAnnotation(result.name)) {
            addAnnotation('flowAnnotation', result);
        } else if (isAsyncAnnotation(result.name)) {
            addAnnotation('asyncAnnotation', result);
        } else if (isTestAnnotation(result.name)) {
            addAnnotation('testAnnotation', result);
        } else if (isRestAnnotation(result.name)) {
            addAnnotation('restAnnotation', result);
        } else if (isVisualforceAnnotation(result.name)) {
            addAnnotation('visualforceAnnotation', result);
        } else if (isAccessAnnotation(result.name)) {
            addAnnotation('accessAnnotation', result);
        } else if (isSerializationAnnotation(result.name)) {
            addAnnotation('serializeAnnotation', result);
        } else if (isExecutionAnnotation(result.name)) {
            addAnnotation('executionAnnotation', result);
        } else if (isCompatibilityAnnotation(result.name)) {
            addAnnotation('compatibilityAnnotation', result);
        } else {
            addAnnotation('otherAnnotation', result);
        }
    });

    return {
        ...modifiers,
        ...annotations,
    };
};
