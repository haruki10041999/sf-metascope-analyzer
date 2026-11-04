import { LwcCommonTypeClass, LwcCommonVisitor } from '../commonVisitor';
import {
    TSCallSignatureDeclarationTypeClass,
    tSCallSignatureDeclarationTypePair,
} from '../commons/tSCallSignatureDeclaration';
import {
    TSConstructSignatureDeclarationTypeClass,
    tSConstructSignatureDeclarationTypePair,
} from '../commons/tSConstructSignatureDeclaration';
import {
    TSPropertySignatureTypeClass,
    tSPropertySignatureTypePair,
} from '../commons/tSPropertySignature';
import {
    TSMethodSignatureTypeClass,
    tSMethodSignatureTypePair,
} from '../commons/tSMethodSignature';
import { TSIndexSignatureTypeClass, tSIndexSignatureTypePair } from '../commons/tSIndexSignature';

export {
    TSCallSignatureDeclarationTypeClass,
    tSCallSignatureDeclarationTypePair,
    isTSCallSignatureDeclarationType,
} from '../commons/tSCallSignatureDeclaration';
export {
    TSConstructSignatureDeclarationTypeClass,
    tSConstructSignatureDeclarationTypePair,
    isTSConstructSignatureDeclarationType,
} from '../commons/tSConstructSignatureDeclaration';
export {
    TSPropertySignatureTypeClass,
    tSPropertySignatureTypePair,
    isTSPropertySignatureType,
} from '../commons/tSPropertySignature';
export {
    TSMethodSignatureTypeClass,
    tSMethodSignatureTypePair,
    isTSMethodSignatureType,
} from '../commons/tSMethodSignature';
export {
    TSIndexSignatureTypeClass,
    tSIndexSignatureTypePair,
    isTSIndexSignatureType,
} from '../commons/tSIndexSignature';

const tSTypeElementVisitorEvaluatePairs = [
    tSCallSignatureDeclarationTypePair,
    tSConstructSignatureDeclarationTypePair,
    tSPropertySignatureTypePair,
    tSMethodSignatureTypePair,
    tSIndexSignatureTypePair,
] as const;

export class TSTypeElementVisitor extends LwcCommonVisitor<
    (typeof tSTypeElementVisitorEvaluatePairs)[number]
> {
    readonly evaluatePair = tSTypeElementVisitorEvaluatePairs;
}

export type TSTypeElementTypeClass =
    | TSCallSignatureDeclarationTypeClass
    | TSConstructSignatureDeclarationTypeClass
    | TSPropertySignatureTypeClass
    | TSMethodSignatureTypeClass
    | TSIndexSignatureTypeClass;

export const isTSTypeElementType = (
    target: LwcCommonTypeClass<string>,
): target is TSTypeElementTypeClass => {
    return (
        target instanceof TSCallSignatureDeclarationTypeClass ||
        target instanceof TSConstructSignatureDeclarationTypeClass ||
        target instanceof TSPropertySignatureTypeClass ||
        target instanceof TSMethodSignatureTypeClass ||
        target instanceof TSIndexSignatureTypeClass
    );
};
