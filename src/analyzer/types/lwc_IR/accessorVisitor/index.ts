import { type TypeField } from '../../commons/ir';
import { isAccessor, type Accessor } from '@babel/types';
import { LwcCommonTypeClass, LwcCommonVisitor, lazyPairs } from '../commonVisitor';
import {
    ClassAccessorPropertyTypeClass,
    classAccessorPropertyTypePair,
} from '../commons/classAccessorProperty';

export {
    ClassAccessorPropertyTypeClass,
    classAccessorPropertyTypePair,
    isClassAccessorPropertyType,
} from '../commons/classAccessorProperty';

export const accessorVisitorEvaluatePairs = lazyPairs(
    () => [classAccessorPropertyTypePair] as const,
);

export class AccessorVisitor extends LwcCommonVisitor<
    ReturnType<typeof accessorVisitorEvaluatePairs>[number]
> {
    get evaluatePair() {
        return accessorVisitorEvaluatePairs();
    }
}

export type AccessorTypeClass = ClassAccessorPropertyTypeClass;

export const isAccessorType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is AccessorTypeClass => {
    return target instanceof ClassAccessorPropertyTypeClass;
};
