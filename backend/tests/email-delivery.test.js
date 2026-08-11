// Report email delivery under time pressure.
//
// The report email is sent at the tail of a Lambda invocation that has already
// spent 40-50s on AI generation, against a 60s hard timeout. Rendering the CJK
// PDF attachment costs seconds on top of that. If the budget is gone, the
// attachment must be dropped so the email itself still goes out — the body
// carries a download link, so a link-only email is a degraded success, while a
// killed invocation is a total loss for a paid deliverable.

const mockSent = [];
const mockPdfCalls = [];

jest.mock('resend', () => ({
  Resend: class {
    constructor() {
      this.emails = {
        send: async (payload) => {
          mockSent.push(payload);
          return { data: { id: 'email-1' }, error: null };
        },
      };
    }
  },
}));

jest.mock('../src/services/pdf.service', () => ({
  generateReportPDF: async (args) => {
    mockPdfCalls.push(args);
    return Buffer.from('%PDF-1.4 fake');
  },
}));

const emailService = require('../src/services/email.service');

const BASE_PARAMS = {
  email: 'reader@example.com',
  childName: '테스트',
  readingId: '11111111-2222-3333-4444-555555555555',
  manseryeok: { pillars: {} },
  aiInterpretation: { fullText: 'a'.repeat(500) },
  birthDate: '2020-01-01',
  gender: 'female',
  language: 'ko',
  reportAccessToken: 'token-abc',
};

beforeAll(() => {
  process.env.RESEND_API_KEY = 'test-key';
});

beforeEach(() => {
  mockSent.length = 0;
  mockPdfCalls.length = 0;
});

describe('sendReportEmail PDF budget handling', () => {
  test('by default renders and attaches the PDF', async () => {
    await emailService.sendReportEmail({ ...BASE_PARAMS });

    expect(mockPdfCalls).toHaveLength(1);
    expect(mockSent).toHaveLength(1);
    expect(mockSent[0].attachments).toHaveLength(1);
    expect(mockSent[0].attachments[0].content_type).toBe('application/pdf');
  });

  test('skipPdf sends the email but renders no attachment', async () => {
    await emailService.sendReportEmail({ ...BASE_PARAMS, skipPdf: true });

    // The expensive call must not happen at all — not merely be discarded.
    expect(mockPdfCalls).toHaveLength(0);
    // The email still goes out; that is the whole point of the degradation.
    expect(mockSent).toHaveLength(1);
    expect(mockSent[0].attachments).toBeUndefined();
    expect(mockSent[0].to).toEqual(['reader@example.com']);
  });

  test('a caller-supplied pdfBuffer is attached without re-rendering', async () => {
    await emailService.sendReportEmail({ ...BASE_PARAMS, pdfBuffer: Buffer.from('%PDF pre-made') });

    expect(mockPdfCalls).toHaveLength(0);
    expect(mockSent[0].attachments).toHaveLength(1);
  });

  test('PDF rendering failure still delivers the email', async () => {
    const pdfService = require('../src/services/pdf.service');
    const original = pdfService.generateReportPDF;
    pdfService.generateReportPDF = async () => { throw new Error('font load failed'); };

    try {
      await expect(emailService.sendReportEmail({ ...BASE_PARAMS })).resolves.toBeDefined();
      expect(mockSent).toHaveLength(1);
      expect(mockSent[0].attachments).toBeUndefined();
    } finally {
      pdfService.generateReportPDF = original;
    }
  });
});
