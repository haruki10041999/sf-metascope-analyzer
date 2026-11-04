import { isAccessor, type Accessor } from '@babel/types';
import { LwcCommonTypeClass, LwcCommonVisitor } from '../commonVisitor';
import {
    ClassAccessorPropertyTypeClass,
    classAccessorPropertyTypePair,
} from '../commons/classAccessorProperty';

export {
    ClassAccessorPropertyTypeClass,
    classAccessorPropertyTypePair,
    isClassAccessorPropertyType,
} from '../commons/classAccessorProperty';

const accessorVisitorEvaluatePairs = [classAccessorPropertyTypePair] as const;

export class AccessorVisitor extends LwcCommonVisitor<
    (typeof accessorVisitorEvaluatePairs)[number]
> {
    readonly evaluatePair = accessorVisitorEvaluatePairs;
}

export type AccessorTypeClass = ClassAccessorPropertyTypeClass;

export const isAccessorType = (target: LwcCommonTypeClass<string>): target is AccessorTypeClass => {
    return target instanceof ClassAccessorPropertyTypeClass;
};
