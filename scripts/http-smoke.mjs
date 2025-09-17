#!/usr/bin/env node

/**
 * HTTP Smoke Test for FreeFlow Backend API
 * Tests all endpoints and returns exit code 0 if all pass, 1 if any fail
 */

import fetch from 'node-fetch';

const API_BASE = process.env.API_BASE || 'http://localhost:3002';
const TIMEOUT = 10000; // 10 seconds

class SmokeTest {
  constructor() {
    this.results = [];
    this.passed = 0;
    this.failed = 0;
  }

  async test(name, testFn) {
    try {
      console.log(`🧪 Testing: ${name}`);
      await testFn();
      this.passed++;
      console.log(`✅ PASS: ${name}`);
    } catch (error) {
      this.failed++;
      console.log(`❌ FAIL: ${name} - ${error.message}`);
      this.results.push({ name, error: error.message });
    }
  }

  async makeRequest(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'FreeFlow-SmokeTest/1.0',
          ...options.headers
        }
      });

      clearTimeout(timeoutId);

      if (response.status >= 400) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return { status: response.status, data };
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    }
  }

  async runHealthTest() {
    const { status, data } = await this.makeRequest('/api/health');
    
    if (status !== 200) {
      throw new Error(`Expected status 200, got ${status}`);
    }
    
    if (data.status !== 'ok') {
      throw new Error(`Expected status 'ok', got '${data.status}'`);
    }
    
    if (data.service !== 'freeflow-backend') {
      throw new Error(`Expected service 'freeflow-backend', got '${data.service}'`);
    }
    
    if (!data.ts) {
      throw new Error('Expected timestamp field');
    }
  }

  async runPlacesTest() {
    const { status, data } = await this.makeRequest('/api/places?query=pizza&n=2&language=pl');
    
    if (status !== 200) {
      throw new Error(`Expected status 200, got ${status}`);
    }
    
    if (data.status !== 'OK') {
      throw new Error(`Expected status 'OK', got '${data.status}'`);
    }
    
    if (!Array.isArray(data.results)) {
      throw new Error('Expected results array');
    }
    
    if (typeof data.total !== 'number') {
      throw new Error('Expected total number');
    }
    
    if (data.results.length > 0) {
      const place = data.results[0];
      if (!place.name) throw new Error('Expected name field in place');
      if (typeof place.rating !== 'number') throw new Error('Expected rating number');
      if (typeof place.votes !== 'number') throw new Error('Expected votes number');
      if (!place.address) throw new Error('Expected address field');
      if (!place.place_id) throw new Error('Expected place_id field');
    }
  }

  async runAgentTest() {
    const { status, data } = await this.makeRequest('/api/agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'ping' })
    });
    
    if (status !== 200) {
      throw new Error(`Expected status 200, got ${status}`);
    }
    
    if (typeof data.ok !== 'boolean') {
      throw new Error('Expected ok boolean field');
    }
    
    // Agent returns different structure - check for summary or followups
    if (!data.summary && !data.followups) {
      throw new Error('Expected summary or followups field');
    }
  }

  async runTTSTest() {
    // TTS returns binary audio data, not JSON
    const url = `${API_BASE}/api/tts`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'Test message' }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.status !== 200) {
        throw new Error(`Expected status 200, got ${response.status}`);
      }

      // Check if response is audio data
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('audio')) {
        throw new Error('Expected audio content type');
      }

      // Check if we got binary data
      const buffer = await response.arrayBuffer();
      if (buffer.byteLength === 0) {
        throw new Error('Expected non-empty audio data');
      }
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    }
  }

  async runGPTTest() {
    const { status, data } = await this.makeRequest('/api/gpt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'Test prompt' })
    });
    
    if (status !== 200) {
      throw new Error(`Expected status 200, got ${status}`);
    }
    
    if (typeof data.reply !== 'string') {
      throw new Error('Expected reply string field');
    }
  }

  async run() {
    console.log(`🚀 Starting FreeFlow API Smoke Tests`);
    console.log(`📍 API Base: ${API_BASE}`);
    console.log(`⏱️  Timeout: ${TIMEOUT}ms`);
    console.log('');

    await this.test('Health Check', () => this.runHealthTest());
    await this.test('Places Search', () => this.runPlacesTest());
    await this.test('Agent Processing', () => this.runAgentTest());
    await this.test('TTS Generation', () => this.runTTSTest());
    await this.test('GPT Completion', () => this.runGPTTest());

    console.log('');
    console.log('📊 Test Results:');
    console.log(`✅ Passed: ${this.passed}`);
    console.log(`❌ Failed: ${this.failed}`);
    console.log(`📈 Total: ${this.passed + this.failed}`);

    if (this.failed > 0) {
      console.log('');
      console.log('❌ Failed Tests:');
      this.results.forEach(result => {
        console.log(`  - ${result.name}: ${result.error}`);
      });
    }

    return this.failed === 0;
  }
}

// Run tests
const smokeTest = new SmokeTest();
smokeTest.run().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('💥 Smoke test failed with error:', error);
  process.exit(1);
});
