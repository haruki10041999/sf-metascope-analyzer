import type { SourceTree } from './sourceTree';

// sfdx のプロジェクトの範囲: sfdx-project.json の packageDirectories と .forceignore で、読むファイルを絞る。
// 方針: docs/analysis-plan.md 5.3

/** sfdx-project.json のうち使うもの */
export type SfdxProject = {
    packageDirectories: { path: string; default?: boolean }[];
    namespace?: string;
};

/** .forceignore の 1 行を正規表現にする (gitignore と同じ書き方の主なもの: *, **, ?, 先頭・末尾の /, !) */
const toPattern = (line: string): { regex: RegExp; negate: boolean } | undefined => {
    let pattern = line.trim();
    if (!pattern || pattern.startsWith('#')) return undefined;
    const negate = pattern.startsWith('!');
    if (negate) pattern = pattern.slice(1);
    const anchored = pattern.startsWith('/') || pattern.slice(0, -1).includes('/');
    pattern = pattern.replace(/^\/+/, '');
    const directory = pattern.endsWith('/');
    pattern = pattern.replace(/\/+$/, '');
    let source = '';
    for (let i = 0; i < pattern.length; i++) {
        const ch = pattern[i]!;
        if (ch === '*' && pattern[i + 1] === '*') {
            // **/ は 0 個以上のフォルダ、末尾の ** は何でも
            if (pattern[i + 2] === '/') {
                source += '(?:.*/)?';
                i += 2;
            } else {
                source += '.*';
                i += 1;
            }
        } else if (ch === '*') source += '[^/]*';
        else if (ch === '?') source += '[^/]';
        else source += ch.replace(/[.+^${}()|[\]\\]/g, '\\$&');
    }
    // フォルダに当たれば、その下のファイルすべて
    const prefix = anchored ? '^' : '^(?:.*/)?';
    const suffix = directory ? '/.*$' : '(?:/.*)?$';
    return { regex: new RegExp(`${prefix}${source}${suffix}`), negate };
};

/** .forceignore の中身から、パス (/ 区切り) を除くかを決める関数 */
export const makeForceIgnore = (content: string): ((filePath: string) => boolean) => {
    const patterns = content
        .split(/\r?\n/)
        .map(toPattern)
        .filter((p): p is NonNullable<typeof p> => p !== undefined);
    return (filePath) => {
        let ignored = false;
        for (const { regex, negate } of patterns) {
            if (regex.test(filePath)) ignored = !negate;
        }
        return ignored;
    };
};

const normalizeDirectory = (directory: string) =>
    directory
        .replace(/\\/g, '/')
        .replace(/^\.\/+/, '')
        .replace(/\/+$/, '');

/**
 * sfdx のプロジェクトの木。sfdx-project.json があれば packageDirectories の下だけを、
 * .forceignore があれば当たるファイルを除いて読む (どちらもなければ、もとの木のまま)
 */
export class ProjectTree implements SourceTree {
    private files?: Promise<string[]>;
    private projectFile?: Promise<SfdxProject | undefined>;

    constructor(private readonly tree: SourceTree) {}

    get root(): string {
        return this.tree.root;
    }

    get label(): string {
        return this.tree.label;
    }

    /** sfdx-project.json (なければ・読めなければ undefined) */
    project(): Promise<SfdxProject | undefined> {
        this.projectFile ??= this.tree.readFile('sfdx-project.json').then((content) => {
            if (content === undefined) return undefined;
            try {
                const json = JSON.parse(content) as Partial<SfdxProject>;
                return Array.isArray(json.packageDirectories) ? (json as SfdxProject) : undefined;
            } catch {
                return undefined;
            }
        });
        return this.projectFile;
    }

    listFiles(): Promise<string[]> {
        this.files ??= (async () => {
            const [files, project, forceIgnore] = await Promise.all([
                this.tree.listFiles(),
                this.project(),
                this.tree.readFile('.forceignore'),
            ]);
            const directories = (project?.packageDirectories ?? [])
                .map((directory) => normalizeDirectory(directory.path))
                .filter((directory) => directory !== '');
            const ignored = forceIgnore === undefined ? () => false : makeForceIgnore(forceIgnore);
            return files.filter(
                (file) =>
                    (directories.length === 0 ||
                        directories.some((directory) => file.startsWith(`${directory}/`))) &&
                    !ignored(file),
            );
        })();
        return this.files;
    }

    readFile(filePath: string): Promise<string | undefined> {
        return this.tree.readFile(filePath);
    }
}
