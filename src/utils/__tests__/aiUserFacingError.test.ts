import { describe, expect, it } from 'vitest';
import {
  AI_BUSY_USER_MESSAGE,
  AI_GENERIC_FAIL_USER_MESSAGE,
  AI_WAITING_USER_MESSAGE,
  isAiBusyMessage,
  toAiUserFacingMessage,
} from '@/utils/aiUserFacingError';

const FORBIDDEN = [
  'busy',
  '429',
  'sol',
  'terra',
  'luna',
  'gpt-4o',
  'openai',
  'rate limit',
  'quota',
];

describe('AI user-facing copy', () => {
  it('waiting copy never says busy or names models', () => {
    const blob = `${AI_WAITING_USER_MESSAGE} ${AI_BUSY_USER_MESSAGE} ${AI_GENERIC_FAIL_USER_MESSAGE}`.toLowerCase();
    for (const word of FORBIDDEN) {
      expect(blob).not.toContain(word);
    }
    expect(AI_WAITING_USER_MESSAGE.toLowerCase()).toContain('please wait');
  });

  it('maps 429 / busy / provider errors to waiting copy', () => {
    expect(isAiBusyMessage('429 Too Many Requests')).toBe(true);
    expect(toAiUserFacingMessage('OpenAI 429 rate limit')).toBe(
      AI_WAITING_USER_MESSAGE,
    );
    expect(toAiUserFacingMessage('Sol busy')).toBe(AI_WAITING_USER_MESSAGE);
    expect(toAiUserFacingMessage('Our AI is finishing other documents')).toBe(
      AI_WAITING_USER_MESSAGE,
    );
    expect(toAiUserFacingMessage('GPT-4o unavailable')).toBe(
      AI_GENERIC_FAIL_USER_MESSAGE,
    );
  });

  it('never leaks model or HTTP codes in rewritten errors', () => {
    const rewritten = [
      toAiUserFacingMessage('429'),
      toAiUserFacingMessage('Using Sol'),
      toAiUserFacingMessage('Switching to GPT-4o'),
      toAiUserFacingMessage('Terra vision failed'),
    ];
    for (const message of rewritten) {
      const lower = message.toLowerCase();
      for (const word of FORBIDDEN) {
        expect(lower).not.toContain(word);
      }
    }
  });
});
