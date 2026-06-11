import { PromptTemplates } from './promptTemplates';

describe('PromptTemplates', () => {
  describe('generateItineraryPrompt', () => {
    it('should generate valid itinerary prompt structure', () => {
      const params = {
        userLocation: { latitude: -7.4728, longitude: 110.2122 },
        destinations: [
          {
            name: 'Borobudur Temple',
            category: 'culture',
            distance: 5.2,
            rating: 4.8,
            description: 'Ancient Buddhist temple',
          },
          {
            name: 'Punthuk Setumbu',
            category: 'nature',
            distance: 3.1,
            rating: 4.5,
          },
        ],
        preferences: {
          interests: ['culture', 'nature'],
          budgetLevel: 'moderate' as const,
          duration: 6,
        },
        startTime: '09:00',
      };

      const result = PromptTemplates.generateItineraryPrompt(params);

      expect(result).toHaveLength(2);
      expect(result[0].role).toBe('system');
      expect(result[1].role).toBe('user');
      expect(result[0].content).toContain('asisten perjalanan AI');
      expect(result[1].content).toContain('Borobudur Temple');
      expect(result[1].content).toContain('5.20 km'); // Check for formatted distance
    });

    it('should include budget level in prompt', () => {
      const params = {
        userLocation: { latitude: -7.4728, longitude: 110.2122 },
        destinations: [
          { name: 'Test Destination', category: 'culture', distance: 1.0 },
        ],
        preferences: {
          interests: ['culture'],
          budgetLevel: 'budget' as const,
          duration: 4,
        },
      };

      const result = PromptTemplates.generateItineraryPrompt(params);

      expect(result[1].content).toContain('hemat');
      expect(result[1].content).toContain('100,000');
    });

    it('should include premium budget in prompt', () => {
      const params = {
        userLocation: { latitude: -7.4728, longitude: 110.2122 },
        destinations: [
          { name: 'Test Destination', category: 'culture', distance: 1.0 },
        ],
        preferences: {
          interests: ['culture'],
          budgetLevel: 'premium' as const,
          duration: 4,
        },
      };

      const result = PromptTemplates.generateItineraryPrompt(params);

      expect(result[1].content).toContain('premium');
      expect(result[1].content).toContain('tidak terbatas');
    });

    it('should include start time if provided', () => {
      const params = {
        userLocation: { latitude: -7.4728, longitude: 110.2122 },
        destinations: [
          { name: 'Test Destination', category: 'culture', distance: 1.0 },
        ],
        preferences: {
          interests: ['culture'],
          budgetLevel: 'moderate' as const,
          duration: 4,
        },
        startTime: '08:30',
      };

      const result = PromptTemplates.generateItineraryPrompt(params);

      expect(result[1].content).toContain('Waktu mulai: 08:30');
    });

    it('should handle destinations without description', () => {
      const params = {
        userLocation: { latitude: -7.4728, longitude: 110.2122 },
        destinations: [
          { name: 'Test Destination', category: 'culture', distance: 1.0 },
        ],
        preferences: {
          interests: ['culture'],
          budgetLevel: 'moderate' as const,
          duration: 4,
        },
      };

      const result = PromptTemplates.generateItineraryPrompt(params);

      expect(result[1].content).toContain('Test Destination');
      expect(result[1].content).not.toContain('Deskripsi:');
    });

    it('should format multiple interests correctly', () => {
      const params = {
        userLocation: { latitude: -7.4728, longitude: 110.2122 },
        destinations: [
          { name: 'Test Destination', category: 'culture', distance: 1.0 },
        ],
        preferences: {
          interests: ['culture', 'nature', 'food'],
          budgetLevel: 'moderate' as const,
          duration: 4,
        },
      };

      const result = PromptTemplates.generateItineraryPrompt(params);

      expect(result[1].content).toContain('culture, nature, food');
    });

    it('should request JSON output format', () => {
      const params = {
        userLocation: { latitude: -7.4728, longitude: 110.2122 },
        destinations: [
          { name: 'Test Destination', category: 'culture', distance: 1.0 },
        ],
        preferences: {
          interests: ['culture'],
          budgetLevel: 'moderate' as const,
          duration: 4,
        },
      };

      const result = PromptTemplates.generateItineraryPrompt(params);

      expect(result[0].content).toContain('JSON');
      expect(result[0].content).toContain('"itinerary"');
      expect(result[1].content).toContain('format JSON');
    });
  });

  describe('generateDestinationInsightPrompt', () => {
    it('should generate valid destination insight prompt structure', () => {
      const params = {
        destinationName: 'Borobudur Temple',
        category: 'culture',
        description: 'Ancient Buddhist temple',
        rating: 4.8,
        userInterests: ['culture', 'history'],
      };

      const result = PromptTemplates.generateDestinationInsightPrompt(params);

      expect(result).toHaveLength(2);
      expect(result[0].role).toBe('system');
      expect(result[1].role).toBe('user');
      expect(result[0].content).toContain('tour guide virtual');
      expect(result[1].content).toContain('Borobudur Temple');
    });

    it('should include all provided parameters', () => {
      const params = {
        destinationName: 'Borobudur Temple',
        category: 'culture',
        description: 'Ancient Buddhist temple',
        rating: 4.8,
        userInterests: ['culture', 'history'],
      };

      const result = PromptTemplates.generateDestinationInsightPrompt(params);

      expect(result[1].content).toContain('Borobudur Temple');
      expect(result[1].content).toContain('culture');
      expect(result[1].content).toContain('Ancient Buddhist temple');
      expect(result[1].content).toContain('4.8/5');
      expect(result[1].content).toContain('culture, history');
    });

    it('should handle missing optional parameters', () => {
      const params = {
        destinationName: 'Test Place',
        category: 'nature',
      };

      const result = PromptTemplates.generateDestinationInsightPrompt(params);

      expect(result[1].content).toContain('Test Place');
      expect(result[1].content).toContain('nature');
      expect(result[1].content).not.toContain('DESKRIPSI:');
      expect(result[1].content).not.toContain('RATING:');
      expect(result[1].content).not.toContain('MINAT PENGGUNA:');
    });

    it('should request JSON output format', () => {
      const params = {
        destinationName: 'Test Place',
        category: 'nature',
      };

      const result = PromptTemplates.generateDestinationInsightPrompt(params);

      expect(result[0].content).toContain('JSON');
      expect(result[0].content).toContain('"tips"');
      expect(result[0].content).toContain('"bestTimeToVisit"');
      expect(result[1].content).toContain('format JSON');
    });
  });

  describe('generateRecommendationPrompt', () => {
    it('should generate valid recommendation prompt structure', () => {
      const params = {
        userPreferences: {
          interests: ['culture', 'nature'],
          budgetLevel: 'moderate',
          mobilityLevel: 7,
        },
        destinations: [
          { name: 'Borobudur', category: 'culture', distance: 5.2, score: 85 },
          { name: 'Punthuk Setumbu', category: 'nature', distance: 3.1, score: 78 },
        ],
        limit: 5,
      };

      const result = PromptTemplates.generateRecommendationPrompt(params);

      expect(result).toHaveLength(2);
      expect(result[0].role).toBe('system');
      expect(result[1].role).toBe('user');
      expect(result[0].content).toContain('recommendation engine');
      expect(result[1].content).toContain('Borobudur');
    });

    it('should include mobility level description for limited mobility', () => {
      const params = {
        userPreferences: {
          interests: ['culture'],
          budgetLevel: 'moderate',
          mobilityLevel: 2,
        },
        destinations: [
          { name: 'Test Place', category: 'culture', distance: 1.0, score: 80 },
        ],
        limit: 5,
      };

      const result = PromptTemplates.generateRecommendationPrompt(params);

      expect(result[1].content).toContain('terbatas');
      expect(result[1].content).toContain('aksesibilitas');
    });

    it('should include mobility level description for moderate mobility', () => {
      const params = {
        userPreferences: {
          interests: ['culture'],
          budgetLevel: 'moderate',
          mobilityLevel: 5,
        },
        destinations: [
          { name: 'Test Place', category: 'culture', distance: 1.0, score: 80 },
        ],
        limit: 5,
      };

      const result = PromptTemplates.generateRecommendationPrompt(params);

      expect(result[1].content).toContain('menengah');
      expect(result[1].content).toContain('berjalan cukup jauh');
    });

    it('should include mobility level description for high mobility', () => {
      const params = {
        userPreferences: {
          interests: ['culture'],
          budgetLevel: 'moderate',
          mobilityLevel: 9,
        },
        destinations: [
          { name: 'Test Place', category: 'culture', distance: 1.0, score: 80 },
        ],
        limit: 5,
      };

      const result = PromptTemplates.generateRecommendationPrompt(params);

      expect(result[1].content).toContain('tinggi');
      expect(result[1].content).toContain('hiking');
    });

    it('should limit destinations to specified limit', () => {
      const params = {
        userPreferences: {
          interests: ['culture'],
          budgetLevel: 'moderate',
          mobilityLevel: 7,
        },
        destinations: [
          { name: 'Place 1', category: 'culture', distance: 1.0, score: 90 },
          { name: 'Place 2', category: 'culture', distance: 2.0, score: 85 },
          { name: 'Place 3', category: 'culture', distance: 3.0, score: 80 },
          { name: 'Place 4', category: 'culture', distance: 4.0, score: 75 },
        ],
        limit: 2,
      };

      const result = PromptTemplates.generateRecommendationPrompt(params);

      expect(result[1].content).toContain('Place 1');
      expect(result[1].content).toContain('Place 2');
      expect(result[1].content).not.toContain('Place 3');
      expect(result[1].content).not.toContain('Place 4');
      expect(result[1].content).toContain('maksimal 2 destinasi');
    });

    it('should format scores with one decimal place', () => {
      const params = {
        userPreferences: {
          interests: ['culture'],
          budgetLevel: 'moderate',
          mobilityLevel: 7,
        },
        destinations: [
          { name: 'Place 1', category: 'culture', distance: 1.234, score: 85.678 },
        ],
        limit: 5,
      };

      const result = PromptTemplates.generateRecommendationPrompt(params);

      expect(result[1].content).toContain('1.23 km');
      expect(result[1].content).toContain('85.7/100');
    });

    it('should request JSON output format', () => {
      const params = {
        userPreferences: {
          interests: ['culture'],
          budgetLevel: 'moderate',
          mobilityLevel: 7,
        },
        destinations: [
          { name: 'Test Place', category: 'culture', distance: 1.0, score: 80 },
        ],
        limit: 5,
      };

      const result = PromptTemplates.generateRecommendationPrompt(params);

      expect(result[0].content).toContain('JSON');
      expect(result[0].content).toContain('"recommendations"');
      expect(result[1].content).toContain('format JSON');
    });
  });

  describe('Prompt consistency', () => {
    it('should use Indonesian language in all prompts', () => {
      const itineraryPrompt = PromptTemplates.generateItineraryPrompt({
        userLocation: { latitude: -7.4728, longitude: 110.2122 },
        destinations: [
          { name: 'Test', category: 'culture', distance: 1.0 },
        ],
        preferences: {
          interests: ['culture'],
          budgetLevel: 'moderate',
          duration: 4,
        },
      });

      const insightPrompt = PromptTemplates.generateDestinationInsightPrompt({
        destinationName: 'Test',
        category: 'culture',
      });

      const recommendationPrompt = PromptTemplates.generateRecommendationPrompt({
        userPreferences: {
          interests: ['culture'],
          budgetLevel: 'moderate',
          mobilityLevel: 7,
        },
        destinations: [
          { name: 'Test', category: 'culture', distance: 1.0, score: 80 },
        ],
        limit: 5,
      });

      expect(itineraryPrompt[0].content).toContain('Bahasa Indonesia');
      expect(insightPrompt[0].content).toContain('Bahasa Indonesia');
      expect(recommendationPrompt[0].content).toContain('Bahasa Indonesia');
    });

    it('should request structured JSON output in all prompts', () => {
      const itineraryPrompt = PromptTemplates.generateItineraryPrompt({
        userLocation: { latitude: -7.4728, longitude: 110.2122 },
        destinations: [
          { name: 'Test', category: 'culture', distance: 1.0 },
        ],
        preferences: {
          interests: ['culture'],
          budgetLevel: 'moderate',
          duration: 4,
        },
      });

      const insightPrompt = PromptTemplates.generateDestinationInsightPrompt({
        destinationName: 'Test',
        category: 'culture',
      });

      const recommendationPrompt = PromptTemplates.generateRecommendationPrompt({
        userPreferences: {
          interests: ['culture'],
          budgetLevel: 'moderate',
          mobilityLevel: 7,
        },
        destinations: [
          { name: 'Test', category: 'culture', distance: 1.0, score: 80 },
        ],
        limit: 5,
      });

      expect(itineraryPrompt[0].content).toContain('JSON');
      expect(insightPrompt[0].content).toContain('JSON');
      expect(recommendationPrompt[0].content).toContain('JSON');
    });
  });
});
