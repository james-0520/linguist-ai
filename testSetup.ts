import { vi, beforeAll, afterAll } from 'vitest';

// Set up global mocks and environment
beforeAll(() => {
    // Set up environment variables
    vi.stubEnv('API_KEY', 'test-api-key');
    vi.stubEnv('GEMINI_IMAGE_MODEL', 'gemini-2.5-flash');
    vi.stubEnv('GEMINI_TEXT_MODEL', 'gemini-2.5-flash');
});

afterAll(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
});
