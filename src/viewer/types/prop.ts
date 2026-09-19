import {
    MetadataObject,
    MetadataObjectDiff,
    MetadataDependency,
    MetadataDependencyDiff,
} from './metadata';

export type MetadataProp = {
    metadata: MetadataObject[] | MetadataObjectDiff[];
    dependency: MetadataDependency[] | MetadataDependencyDiff[];
};

export type Prop = { type: 'metadata' } & MetadataProp;
