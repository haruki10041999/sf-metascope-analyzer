import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { parseApexUnitFiles } from '../../src/analyzer/parser/Apex/unit';
import { getApexDependencies } from '../../src/analyzer/processor/dependency/apex';
import {
    type GraphUnit,
    buildDependencyGraph,
} from '../../src/analyzer/processor/dependency/graph';

// Apex の名前を文字列などで渡す参照 (docs/json-gaps.md 4.1・5 章の 4)。文字列はリテラルのときだけ参照にする

const dependenciesOf = async (name: string, lines: string[]) => {
    const source = [`public class ${name} {`, ...lines, '}'].join('\n');
    const unit = await parseApexUnitFiles({
        unitType: 'class',
        name,
        filePath: `${name}.cls`,
        source: { fileName: `${name}.cls`, source },
    });
    assert.deepEqual(unit.resolvedError, []);
    return getApexDependencies(unit);
};

/** 調べる種類の参照だけ (kind refType:target (via)) */
const refsOf = (dependencies: Awaited<ReturnType<typeof dependenciesOf>>, refTypes: string[]) => [
    ...new Set(
        dependencies.references
            .filter((r) => refTypes.includes(r.refType))
            .map((r) => `${r.kind} ${r.refType}:${r.target} (${r.via})`),
    ),
];

const defUnit = (type: string, name: string): GraphUnit => ({
    type,
    id: `${type}_${name}`,
    dependencies: { definitions: [{ defType: type, name }], references: [] },
});

describe('Apex string-argument references (文字列の引数などの参照)', () => {
    it("references Visualforce pages from Page.X and new PageReference('/apex/X')", async () => {
        const dependencies = await dependenciesOf('Pages', [
            '    public PageReference run() {',
            '        PageReference a = Page.MyPage;',
            '        String url = Page.Detail.getUrl();',
            "        PageReference b = new PageReference('/apex/Other?id=1');",
            "        PageReference c = new PageReference('/apex/ns__Packaged');",
            "        PageReference d = new PageReference('https://example.com/apex/NotPage');",
            "        PageReference e = new PageReference('/apex/' + name);",
            '        return System.Page.Last;',
            '    }',
        ]);
        assert.deepEqual(refsOf(dependencies, ['visualforcePage']).sort(), [
            'uses visualforcePage:Detail (Page)',
            'uses visualforcePage:Last (Page)',
            'uses visualforcePage:MyPage (Page)',
            'uses visualforcePage:Other (PageReference)',
            'uses visualforcePage:ns__Packaged (PageReference)',
        ]);
        const graph = buildDependencyGraph([
            { type: 'apexClass', id: 'class_Pages', dependencies },
            defUnit('apexPage', 'MyPage'),
        ]);
        assert.equal(graph.nodes.get('apexPage:MyPage')?.origin, 'repository');
        assert.ok(graph.edges.some((e) => e.to === 'apexPage:MyPage'));
    });

    it('does not treat a variable named page as Page.X', async () => {
        const dependencies = await dependenciesOf('Vars', [
            '    public class Holder { public String Name; }',
            '    public void run(Holder page) {',
            '        String n = page.Name;',
            '    }',
        ]);
        assert.deepEqual(refsOf(dependencies, ['visualforcePage']), []);
    });

    it('references static resources from forResource and the StaticResource SOQL', async () => {
        const dependencies = await dependenciesOf('Resources', [
            '    public void run(String name) {',
            "        PageReference a = PageReference.forResource('Logo');",
            "        PageReference b = PageReference.forResource('Bundle', 'img/a.png');",
            '        PageReference c = PageReference.forResource(name);',
            "        StaticResource d = [SELECT Body FROM StaticResource WHERE Name = 'Config' LIMIT 1];",
            "        List<StaticResource> e = [SELECT Body FROM StaticResource WHERE Name IN ('A', 'B')];",
            '        List<StaticResource> f = [SELECT Body FROM StaticResource WHERE Name = :name];',
            "        List<Account> g = [SELECT Id FROM Account WHERE Name = 'Acme'];",
            '    }',
        ]);
        assert.deepEqual(refsOf(dependencies, ['staticResource']).sort(), [
            'uses staticResource:A (soql.where)',
            'uses staticResource:B (soql.where)',
            'uses staticResource:Bundle (PageReference.forResource)',
            'uses staticResource:Config (soql.where)',
            'uses staticResource:Logo (PageReference.forResource)',
        ]);
        const graph = buildDependencyGraph([
            { type: 'apexClass', id: 'class_Resources', dependencies },
            defUnit('staticResource', 'Logo'),
        ]);
        assert.equal(graph.nodes.get('staticResource:Logo')?.origin, 'repository');
    });

    it('references classes from Type.forName with string literals only', async () => {
        const dependencies = await dependenciesOf('Types', [
            '    public void run(String name) {',
            "        Type a = Type.forName('Handler');",
            "        Type b = Type.forName('Outer.Inner');",
            "        Type c = Type.forName('', 'NoNs');",
            "        Type d = Type.forName(null, 'NullNs');",
            "        Type e = Type.forName('pkg', 'Packaged');",
            '        Type f = Type.forName(name);',
            '    }',
        ]);
        assert.deepEqual(
            dependencies.references
                .filter((r) => r.via === 'Type.forName')
                .map((r) => `${r.kind} ${r.refType}:${r.target}`),
            [
                'uses apexType:Handler',
                'uses apexType:Outer.Inner',
                'uses apexType:NoNs',
                'uses apexType:NullNs',
            ],
        );
        const graph = buildDependencyGraph([
            { type: 'apexClass', id: 'class_Types', dependencies },
            defUnit('apexClass', 'Handler'),
        ]);
        assert.ok(graph.edges.some((e) => e.to === 'apexClass:Handler'));
    });

    it('references named credentials from callout: string literals', async () => {
        const dependencies = await dependenciesOf('Callouts', [
            "    private static final String BASE = 'callout:Const_NC';",
            '    public void run(HttpRequest req, String name) {',
            "        req.setEndpoint('callout:My_NC/services/data');",
            "        req.setEndpoint('callout:' + name);",
            "        req.setEndpoint('https://example.com/callout:Nope');",
            '    }',
        ]);
        assert.deepEqual(refsOf(dependencies, ['namedCredential']).sort(), [
            'uses namedCredential:Const_NC (callout)',
            'uses namedCredential:My_NC (callout)',
        ]);
        const graph = buildDependencyGraph([
            { type: 'apexClass', id: 'class_Callouts', dependencies },
            defUnit('namedCredential', 'My_NC'),
        ]);
        assert.equal(graph.nodes.get('namedCredential:My_NC')?.origin, 'repository');
    });

    it('references flows from Flow.Interview', async () => {
        const dependencies = await dependenciesOf('Flows', [
            '    public void run(Map<String, Object> params, String name) {',
            '        Flow.Interview.My_Flow a = new Flow.Interview.My_Flow(params);',
            "        Flow.Interview b = Flow.Interview.createInterview('Other_Flow', params);",
            "        Flow.Interview c = Flow.Interview.createInterview('', 'NoNs_Flow', params);",
            '        Flow.Interview d = Flow.Interview.createInterview(name, params);',
            '    }',
        ]);
        assert.deepEqual(refsOf(dependencies, ['flow']).sort(), [
            'calls flow:My_Flow (Flow.Interview)',
            'calls flow:NoNs_Flow (Flow.Interview.createInterview)',
            'calls flow:Other_Flow (Flow.Interview.createInterview)',
            'uses flow:My_Flow (Flow.Interview)',
        ]);
        // 標準の型 Flow.Interview.My_Flow にはしない
        assert.ok(!dependencies.references.some((r) => r.target === 'Flow.Interview.My_Flow'));
    });

    it('distinguishes publishing platform events (publishes)', async () => {
        const dependencies = await dependenciesOf('Events', [
            '    public void run(List<Order_Event__e> events, Account acc) {',
            '        EventBus.publish(new Order_Event__e(Status__c = 1));',
            '        EventBus.publish(events);',
            '        EventBus.publish(new List<Other__e>{ new Other__e() });',
            '        EventBus.publish(acc);',
            '    }',
        ]);
        assert.deepEqual(
            dependencies.references
                .filter((r) => r.kind === 'publishes')
                .map((r) => `${r.refType}:${r.target} (${r.via})`),
            [
                'object:Order_Event__e (EventBus.publish)',
                'object:Order_Event__e (EventBus.publish)',
                'object:Other__e (EventBus.publish)',
            ],
        );
    });

    it('references custom labels from Label.get', async () => {
        const dependencies = await dependenciesOf('Labels', [
            '    public void run(String name) {',
            '        String a = System.Label.Greeting;',
            "        String b = System.Label.get('', 'Farewell');",
            "        String c = Label.get(null, 'Thanks', 'ja');",
            "        String d = System.Label.get('pkg', 'Packaged');",
            "        String e = System.Label.get('', name);",
            '    }',
        ]);
        assert.deepEqual(refsOf(dependencies, ['customLabel']).sort(), [
            'uses customLabel:Farewell (Label.get)',
            'uses customLabel:Greeting (Label)',
            'uses customLabel:Thanks (Label.get)',
        ]);
    });
});
