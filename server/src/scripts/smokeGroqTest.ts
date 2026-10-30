import { env } from '../config/env';
import { groqService } from '../services/groqService';

async function main() {
  console.log('[GROQ SMOKE TEST] Initializing live test against configured Groq model...');

  if (!env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not defined in environment variables.');
  }

  // Obfuscated key verification (e.g. gsk_...XXXX)
  const keyPrefix = env.GROQ_API_KEY.slice(0, 4);
  const keySuffix = env.GROQ_API_KEY.slice(-4);
  console.log(`[GROQ SMOKE TEST] Key loaded securely: ${keyPrefix}...${keySuffix} (length: ${env.GROQ_API_KEY.length})`);
  console.log(`[GROQ SMOKE TEST] Target Model: ${env.GROQ_MODEL}`);

  const mockChunks = [
    {
      pageNumber: 1,
      chunkId: 'chunk-test-1',
      content: 'Chandigarh University is a leading academic institution offering AI, Computer Science, and Engineering degrees.',
    },
    {
      pageNumber: 2,
      chunkId: 'chunk-test-2',
      content: 'CUCampusSaathi is the official AI-powered university knowledge and collaboration network.',
    },
  ];

  const question = 'What is CUCampusSaathi according to the document?';

  const startTime = Date.now();
  const result = await groqService.generateAnswer(
    question,
    mockChunks as any,
    'CUCampusSaathi Introduction Guide',
    []
  );
  const duration = Date.now() - startTime;

  console.log(`[GROQ SMOKE TEST SUCCESS] Response received in ${duration}ms!`);
  console.log(`[GROQ SMOKE TEST SUCCESS] Model used: ${result.model}`);
  console.log(`[GROQ SMOKE TEST SUCCESS] Total tokens: ${result.totalTokens ?? 'N/A'}`);
  console.log(`[GROQ SMOKE TEST SUCCESS] Generated answer length: ${result.answer.length} characters.`);
  console.log(`[GROQ SMOKE TEST SUCCESS] Answer snippet: "${result.answer.slice(0, 160)}..."`);
}

main().catch((err) => {
  console.error('[GROQ SMOKE TEST FAILED]', err.message);
  process.exit(1);
});
