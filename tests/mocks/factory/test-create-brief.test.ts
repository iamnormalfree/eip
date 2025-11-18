import { mockFactory } from './mock-factory';

describe('createBrief method', () => {
  it('should create a valid brief mock with required parameters', () => {
    const result = mockFactory.createBrief({
      brief: 'Test brief content for EIP system',
      tier: 'MEDIUM'
    });

    expect(result.success).toBe(true);
    expect(result.mock).toBeDefined();
    expect(result.mock.brief).toBe('Test brief content for EIP system');
    expect(result.mock.tier).toBe('MEDIUM');
    expect(result.mock.persona).toBe('test-persona');
    expect(result.mock.funnel).toBe('test-funnel');
    expect(result.mock.queue_mode).toBe(false);
    expect(result.mock.correlation_id).toMatch(/^corr-\d+$/);
  });

  it('should create a brief mock with all specified parameters', () => {
    const result = mockFactory.createBrief({
      brief: 'Custom brief content',
      persona: 'custom-persona',
      funnel: 'custom-funnel',
      tier: 'HEAVY',
      correlation_id: 'custom-corr-123',
      queue_mode: true
    });

    expect(result.success).toBe(true);
    expect(result.mock.brief).toBe('Custom brief content');
    expect(result.mock.persona).toBe('custom-persona');
    expect(result.mock.funnel).toBe('custom-funnel');
    expect(result.mock.tier).toBe('HEAVY');
    expect(result.mock.correlation_id).toBe('custom-corr-123');
    expect(result.mock.queue_mode).toBe(true);
  });

  it('should validate brief parameter correctly', () => {
    // Test with empty brief should still succeed (brief is required but can be empty string)
    const result = mockFactory.createBrief({
      brief: '',
      tier: 'LIGHT'
    });

    expect(result.success).toBe(true);
    expect(result.mock.brief).toBe('');
  });
});
