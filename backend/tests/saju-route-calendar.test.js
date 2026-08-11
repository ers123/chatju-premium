const express = require('express');
const request = require('supertest');

jest.mock('../src/services/saju.service', () => ({
  generateSajuPreview: jest.fn(async () => ({
    manseryeok: { pillars: {}, elements: {} },
    aiPreview: { shortText: '' },
  })),
}));

jest.mock('../src/middleware/auth', () => {
  const middleware = (req, res, next) => next();
  middleware.optionalAuth = (req, res, next) => {
    req.user = null;
    next();
  };
  return middleware;
});

jest.mock('../src/services/promo.service', () => ({
  validatePromoCode: jest.fn(),
  hasEmailUsedPromo: jest.fn(),
  usePromoCode: jest.fn(),
}));

jest.mock('../src/utils/mansae-wrapper', () => ({
  calculateMansae: jest.fn(() => ({
    pillars: {
      day: { korean: '갑자', element: '목 + 수' },
    },
    elements: { wood: 1, fire: 0, earth: 0, metal: 0, water: 1 },
  })),
}));

const sajuService = require('../src/services/saju.service');
const { calculateMansae } = require('../src/utils/mansae-wrapper');
const sajuRoutes = require('../src/routes/saju.routes');

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/saju', sajuRoutes);
  return app;
}

describe('Saju route calendar flags', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('preview forwards child and parent lunar flags into calculation path', async () => {
    const app = buildApp();

    const response = await request(app)
      .post('/saju/preview')
      .send({
        birthDate: '1983-01-26',
        birthTime: '12:00',
        gender: 'female',
        isLunar: true,
        isLeapMonth: true,
        language: 'ko',
        parentBirthDate: '1983-01-26',
        parentBirthTime: '12:00',
        parentRole: 'mother',
        parentIsLunar: true,
        parentIsLeapMonth: true,
      });

    expect(response.status).toBe(200);
    expect(sajuService.generateSajuPreview).toHaveBeenCalledWith(
      expect.objectContaining({
        birthDate: '1983-01-26',
        isLunar: true,
        isLeapMonth: true,
      })
    );
    expect(calculateMansae).toHaveBeenCalledWith(
      '1983-01-26',
      '12:00',
      '여',
      expect.objectContaining({
        isLunar: true,
        isLeapMonth: true,
      })
    );
  });
});
