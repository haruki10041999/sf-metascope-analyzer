import { DependencyView, ObjectView } from './metadata';

/** 表示するオブジェクトと参照関係。差分のレポートでは各要素が status を持つ */
export type MetadataProp = {
    metadata: ObjectView[];
    dependency: DependencyView[];
};

export type Prop = { type: 'metadata' } & MetadataProp;
