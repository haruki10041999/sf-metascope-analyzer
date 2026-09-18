import {
    MetadataCommonType,
    MetadataObjectDiff,
    MetadataFieldDiff,
    MetadataDependency,
    MetadataDependencyDiff,
} from '../../types/index';

export class MetadataDependencyProcessor {
    private dependencyDiffs: MetadataDependencyDiff[] = [];

    constructor(metadataObjectDiffs: MetadataObjectDiff[]) {
        this.reset(metadataObjectDiffs);
    }

    getAllDependencyDiff(): MetadataDependencyDiff[] {
        return this.dependencyDiffs;
    }

    getDependencyDiff(targetObjectApiNames: string[], depth = 1): MetadataDependencyDiff[] {
        if (!Number.isInteger(depth) || depth <= 0) {
            return [];
        }

        const dependencyDiffs: MetadataDependencyDiff[] = [];
        let targetApiNames = new Set(targetObjectApiNames);
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

    getAllDependency(): MetadataDependency[] {
        return this.convertDependency(this.dependencyDiffs);
    }

    getDependency(targetObjectApiNames: string[], depth = 1): MetadataDependency[] {
        return this.convertDependency(this.getDependencyDiff(targetObjectApiNames, depth));
    }

    convertDependency(dependencyDiff: MetadataDependencyDiff[]): MetadataDependency[] {
        return dependencyDiff.map(({ status, ...dependency }) => dependency);
    }

    reset(metadataObjectDiffs: MetadataObjectDiff[]): void {
        this.dependencyDiffs = this.calculateDependency(metadataObjectDiffs);
    }

    private calculateDependency(
        metadataObjectDiffs: MetadataObjectDiff[],
    ): MetadataDependencyDiff[] {
        const dependencyDiffs: MetadataDependencyDiff[] = [];

        metadataObjectDiffs.forEach((metadataDiff) => {
            const parentObjectApiName = metadataDiff.apiName;
            metadataDiff.fields.forEach((fieldDiff) => {
                if (fieldDiff.type !== 'Lookup' && fieldDiff.type !== 'MasterDetail') {
                    return;
                }
                const parentFieldApiName = fieldDiff.apiName;
                const chidObjectApiName = fieldDiff.referenceObjectApiName;
                const status = fieldDiff.status;
                dependencyDiffs.push({
                    parentObjectApiName: parentObjectApiName,
                    parentFieldApiName: parentFieldApiName,
                    childObjectApiName: chidObjectApiName,
                    type: fieldDiff.type,
                    status: status,
                });
            });
        });

        return dependencyDiffs;
    }
}
