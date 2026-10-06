const { describe, it } = require('node:test');
const assert = require('node:assert');
const { capitalize, truncate, slugify } = require('../index.js');

describe('String Utils Suite', () => {
  it('should capitalize strings properly', () => {
    assert.strictEqual(capitalize('hello world'), 'Hello world');
    assert.strictEqual(capitalize(''), '');
  });

  it('should truncate strings exceeding length', () => {
    assert.strictEqual(truncate('short', 10), 'short');
    assert.strictEqual(truncate('this is a very long string', 10), 'this is a ...');
  });

  it('should format URL slug correctly with lowercase and hyphens', () => {
    assert.strictEqual(slugify('Hello World'), 'hello-world');
    assert.strictEqual(slugify('Hacknex 2026 AI Agent'), 'hacknex-2026-ai-agent');
  });
});
