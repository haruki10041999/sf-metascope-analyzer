import path from 'node:path';
import { Repository, WorkingTree } from '../src/analyzer/unit';
const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const main = async () => {
    const repo = await Repository.load(new WorkingTree(path.resolve('docs/examples/repository/after')));
    const perType: Record<string, { units: number; nodes: number; edges: number; leafArrays: number; sources: number; dupIds: number; bytes: number; nodeBytes: number }> = {};
    for (const [type, results] of repo.entries()) {
        const t = (perType[type] ??= { units: 0, nodes: 0, edges: 0, leafArrays: 0, sources: 0, dupIds: 0, bytes: 0, nodeBytes: 0 });
        for (const r of results) {
            t.units++;
            t.bytes += JSON.stringify(r.result).length;
            const seen = new Set<string>();
            const walk = (v: unknown, parentIsNode: boolean): void => {
                if (Array.isArray(v)) { v.forEach((x) => walk(x, parentIsNode)); return; }
                if (!isObj(v)) return;
                const isNode = typeof v.kind === 'string' && isObj(v.sourceKeys);
                if (isNode) {
                    t.nodes++;
                    if (parentIsNode) t.edges++;
                    const sk = v.sourceKeys as any;
                    const id = JSON.stringify(sk.base ?? sk);
                    if (seen.has(id)) t.dupIds++; else seen.add(id);
                    // own bytes: properties that are not nodes
                    const own = Object.fromEntries(Object.entries(v).filter(([k, x]) => k !== 'sourceKeys' && !(isObj(x) && 'kind' in x) && !(Array.isArray(x) && x.some((y) => isObj(y) && 'kind' in y))));
                    t.nodeBytes += JSON.stringify(own).length;
                }
                if (typeof v.objectKey === 'string' && Array.isArray(v.source)) t.sources += (v.source as unknown[]).length;
                for (const [k, x] of Object.entries(v)) if (k !== 'sourceKeys') walk(x, isNode || parentIsNode);
            };
            walk(r.result, false);
        }
    }
    const total = Object.values(perType).reduce((a, b) => { for (const k of Object.keys(a) as (keyof typeof a)[]) a[k] += b[k]; return a; }, { units: 0, nodes: 0, edges: 0, leafArrays: 0, sources: 0, dupIds: 0, bytes: 0, nodeBytes: 0 });
    const top = Object.entries(perType).sort((a, b) => b[1].nodes - a[1].nodes).slice(0, 12);
    console.table(Object.fromEntries([...top, ['TOTAL', total]]));
};
void main();
