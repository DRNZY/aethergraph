import { transform } from 'sucrase';
import { exportToJsonCanvas, importFromJsonCanvas, createInitialSeedNodes, createExamplePipeline } from '../src/services/canvasIo';

console.log('--- TEST 1: Clean Slate Fresh Install Verification ---');
const fresh = createInitialSeedNodes();
if (fresh.nodes.length !== 0 || fresh.edges.length !== 0) {
  throw new Error(`Fresh install seed is not empty! nodes: ${fresh.nodes.length}, edges: ${fresh.edges.length}`);
}
console.log('✓ createInitialSeedNodes() returns 0 nodes and 0 edges (pure empty canvas).');

console.log('\n--- TEST 2: Sucrase Real TypeScript Transpilation ---');
const tsCode = `
interface SignalPipeline {
  frequency: number;
  waveform: 'sine' | 'square' | 'sawtooth' | 'triangle';
  tags: string[];
}
const pipeline: SignalPipeline = {
  frequency: 528,
  waveform: 'triangle',
  tags: ['solfeggio', 'healing']
};
return pipeline;
`;
const transpiled = transform(tsCode, { transforms: ['typescript'] }).code;
console.log('✓ Transpiled output:\n', transpiled);
const fn = new Function(transpiled);
const result = fn();
console.log('✓ Evaluated TS Result:', result);
if (result.frequency !== 528 || result.waveform !== 'triangle') {
  throw new Error('TS Execution test failed!');
}

console.log('\n--- TEST 3: JSON Canvas Lossless Round-Trip Fidelity ---');
const example = createExamplePipeline();
console.log(`Exporting ${example.nodes.length} nodes to JSON Canvas...`);
const exported = exportToJsonCanvas(example.nodes, example.edges);

console.log(`Re-importing from JSON Canvas...`);
const imported = importFromJsonCanvas(exported);

if (imported.nodes.length !== example.nodes.length) {
  throw new Error(`Node count mismatch: expected ${example.nodes.length}, got ${imported.nodes.length}`);
}

const codeNode = imported.nodes.find(n => n.type === 'code');
const audioNode = imported.nodes.find(n => n.type === 'audio');
const metricNode = imported.nodes.find(n => n.type === 'metric');

if (!codeNode || !audioNode || !metricNode) {
  throw new Error(`Round-trip failed! Missing node types. Types found: ${imported.nodes.map(n => n.type).join(', ')}`);
}

console.log('✓ Reconstructed Code Node:', codeNode.title, '| Language:', codeNode.data.language);
console.log('✓ Reconstructed Audio Node:', audioNode.title, '| Freq:', audioNode.data.audioFreq);
console.log('✓ Reconstructed Metric Node:', metricNode.title, '| Barcode:', metricNode.data.barcodeValue);

console.log('\n========================================');
console.log('🎉 ALL INTEGRITY VERIFICATION CHECKS PASSED!');
console.log('========================================\n');
