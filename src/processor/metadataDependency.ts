import { Dependency, DependencyDiff } from '../types/metadataDependency';

import { CommonType, MetadataObjectDiff, MetadataFieldDiff } from '../types/metadata';

export class MetadataDependencyProcessor {
    private dependencyDiffs: DependencyDiff[] = [];

    constructor(metadataObjectDiffs: MetadataObjectDiff[]) {
        this.reset(metadataObjectDiffs);
    }

    getAllDependencyDiff(): DependencyDiff[] {
        return this.dependencyDiffs;
    }

    getDependencyDiff(targetObjectApiName: string, depth = 1): DependencyDiff[] {
        if (!Number.isInteger(depth) || depth <= 0) {
            return [];
        }

        const dependencyDiffs: DependencyDiff[] = [];
        let targetApiNames = new Set([targetObjectApiName]);
        const addedDependencies = new Set<string>();
        let maxDepth = depth;
        while (targetApiNames.size > 0 && maxDepth > 0) {
            const nextTargetApiNames: Set<string> = new Set();
            this.dependencyDiffs.forEach((dependencyDiff) => {
                const parentApiName = dependencyDiff.parentObjectApiName;
                const dependencyKey = `${parentApiName}.${dependencyDiff.parentFieldApiName}.${dependencyDiff.childObjectApiName}`;
                if (!addedDependencies.has(dependencyKey) && targetApiNames.has(parentApiName)) {
                    dependencyDiffs.push(dependencyDiff);
                    nextTargetApiNames.add(dependencyDiff.childObjectApiName);
                    addedDependencies.add(dependencyKey);
                }
            });
            targetApiNames = nextTargetApiNames;
            maxDepth--;
        }
        return dependencyDiffs;
    }

    getAllDependency(): Dependency[] {
        return this.convertDependency(this.dependencyDiffs);
    }

    getDependency(targetObjectApiName: string, depth = 1): Dependency[] {
        return this.convertDependency(this.getDependencyDiff(targetObjectApiName, depth));
    }

    convertDependency(dependencyDiff: DependencyDiff[]): Dependency[] {
        return dependencyDiff.map(({ status, ...dependency }) => dependency);
    }

    reset(metadataObjectDiffs: MetadataObjectDiff[]): void {
        this.dependencyDiffs = this.calculateDependency(metadataObjectDiffs);
    }

    private calculateDependency(metadataObjectDiffs: MetadataObjectDiff[]): DependencyDiff[] {
        const dependencyDiffs: DependencyDiff[] = [];

        const processedMetadataDiffs: MetadataObjectDiff[] = metadataObjectDiffs.map((object) => {
            return {
                ...object,
                fields: object.fields.filter((field) => field.referenceObjectApiName),
            };
        });

        processedMetadataDiffs.forEach((metadataDiff) => {
            const parentObjectApiName = metadataDiff.apiName;
            metadataDiff.fields.forEach((fieldDiff) => {
                const parentFieldApiName = fieldDiff.apiName;
                const chidObjectApiName = fieldDiff.referenceObjectApiName!;
                const status = fieldDiff.status;
                dependencyDiffs.push({
                    parentObjectApiName: parentObjectApiName,
                    parentFieldApiName: parentFieldApiName,
                    childObjectApiName: chidObjectApiName,
                    status: status,
                });
            });
        });

        return dependencyDiffs;
    }
}
