/**
 * Prompt Templates untuk OpenAI API
 * Validates: Requirements 15 (AI-Powered Itinerary), 17 (AI Insights)
 */

export interface ItineraryPromptParams {
  userLocation: { latitude: number; longitude: number };
  destinations: Array<{
    name: string;
    category: string;
    distance: number;
    rating?: number;
    description?: string;
  }>;
  preferences: {
    interests: string[];
    budgetLevel: 'budget' | 'moderate' | 'premium';
    duration: number; // hours
  };
  startTime?: string;
}

export interface DestinationInsightParams {
  destinationName: string;
  category: string;
  description?: string;
  rating?: number;
  userInterests?: string[];
}

export class PromptTemplates {
  /**
   * Generate itinerary prompt
   */
  static generateItineraryPrompt(params: ItineraryPromptParams): Array<{
    role: 'system' | 'user';
    content: string;
  }> {
    const systemPrompt = `Anda adalah asisten perjalanan AI yang ahli dalam merencanakan itinerary wisata di Magelang, Indonesia. 

Tugas Anda adalah membuat itinerary yang:
- Optimal berdasarkan waktu dan jarak
- Sesuai dengan minat dan budget pengguna
- Realistis dan mudah diikuti
- Mempertimbangkan waktu perjalanan antar destinasi
- Memberikan tips praktis

Format output dalam JSON dengan struktur:
{
  "itinerary": [
    {
      "order": 1,
      "destinationName": "Nama Destinasi",
      "startTime": "09:00",
      "endTime": "11:00",
      "duration": 120,
      "activities": ["Aktivitas 1", "Aktivitas 2"],
      "travelTime": 15,
      "estimatedCost": 50000
    }
  ],
  "summary": "Ringkasan singkat itinerary",
  "tips": ["Tip 1", "Tip 2", "Tip 3"],
  "totalEstimatedCost": 200000
}

Gunakan Bahasa Indonesia yang ramah dan informatif.`;

    const destinationsList = params.destinations
      .map(
        (dest, idx) =>
          `${idx + 1}. ${dest.name} (${dest.category})
   - Jarak: ${dest.distance.toFixed(2)} km
   - Rating: ${dest.rating || 'N/A'}/5
   ${dest.description ? `- Deskripsi: ${dest.description}` : ''}`
      )
      .join('\n\n');

    const budgetText =
      params.preferences.budgetLevel === 'budget'
        ? 'hemat (maksimal Rp 100,000 per hari)'
        : params.preferences.budgetLevel === 'moderate'
        ? 'menengah (maksimal Rp 300,000 per hari)'
        : 'premium (tidak terbatas)';

    const userPrompt = `Buatkan itinerary perjalanan dengan detail berikut:

LOKASI PENGGUNA:
- Koordinat: ${params.userLocation.latitude}, ${params.userLocation.longitude}

DESTINASI TERSEDIA:
${destinationsList}

PREFERENSI PENGGUNA:
- Minat: ${params.preferences.interests.join(', ')}
- Budget: ${budgetText}
- Durasi tersedia: ${params.preferences.duration} jam
${params.startTime ? `- Waktu mulai: ${params.startTime}` : ''}

Buatkan itinerary optimal yang:
1. Mengoptimalkan rute (minimal backtracking)
2. Sesuai budget dan waktu
3. Pilih 2-5 destinasi sesuai durasi
4. Berikan estimasi waktu realistis (termasuk perjalanan)
5. Sertakan tips praktis

Output dalam format JSON seperti yang diminta.`;

    return [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ];
  }

  /**
   * Generate destination insights prompt
   */
  static generateDestinationInsightPrompt(
    params: DestinationInsightParams
  ): Array<{
    role: 'system' | 'user';
    content: string;
  }> {
    const systemPrompt = `Anda adalah tour guide virtual yang ahli tentang destinasi wisata di Magelang, Indonesia.

Tugas Anda adalah memberikan informasi praktis dan menarik tentang destinasi, termasuk:
- Tips kunjungan
- Waktu terbaik berkunjung
- Rekomendasi lokal
- Informasi historis/budaya (jika relevan)
- Estimasi waktu kunjungan

Format output dalam JSON:
{
  "tips": ["Tip 1", "Tip 2", "Tip 3"],
  "bestTimeToVisit": "Waktu terbaik berkunjung",
  "localRecommendations": ["Rekomendasi 1", "Rekomendasi 2"],
  "historicalInfo": "Informasi historis/budaya",
  "estimatedVisitTime": 90
}

Gunakan Bahasa Indonesia yang ramah dan informatif.`;

    const userPrompt = `Berikan insight tentang destinasi berikut:

DESTINASI: ${params.destinationName}
KATEGORI: ${params.category}
${params.description ? `DESKRIPSI: ${params.description}` : ''}
${params.rating ? `RATING: ${params.rating}/5` : ''}
${params.userInterests ? `MINAT PENGGUNA: ${params.userInterests.join(', ')}` : ''}

Berikan informasi praktis yang membantu wisatawan merencanakan kunjungan mereka.

Output dalam format JSON seperti yang diminta.`;

    return [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ];
  }

  /**
   * Generate personalized recommendation prompt
   */
  static generateRecommendationPrompt(params: {
    userPreferences: {
      interests: string[];
      budgetLevel: string;
      mobilityLevel: number;
    };
    destinations: Array<{
      name: string;
      category: string;
      distance: number;
      score: number;
    }>;
    limit: number;
  }): Array<{
    role: 'system' | 'user';
    content: string;
  }> {
    const systemPrompt = `Anda adalah AI recommendation engine untuk destinasi wisata di Magelang.

Tugas Anda adalah memberikan rekomendasi destinasi yang dipersonalisasi dengan penjelasan mengapa cocok untuk pengguna.

Format output dalam JSON:
{
  "recommendations": [
    {
      "destinationName": "Nama Destinasi",
      "reason": "Alasan singkat mengapa direkomendasikan",
      "highlight": "Highlight utama destinasi"
    }
  ]
}

Gunakan Bahasa Indonesia yang persuasif namun informatif.`;

    const destinationsList = params.destinations
      .slice(0, params.limit)
      .map(
        (dest, idx) =>
          `${idx + 1}. ${dest.name} (${dest.category})
   - Jarak: ${dest.distance.toFixed(2)} km
   - Score: ${dest.score.toFixed(1)}/100`
      )
      .join('\n\n');

    const mobilityText =
      params.userPreferences.mobilityLevel <= 3
        ? 'terbatas (perlu aksesibilitas)'
        : params.userPreferences.mobilityLevel <= 7
        ? 'menengah (dapat berjalan cukup jauh)'
        : 'tinggi (dapat hiking/trekking)';

    const userPrompt = `Berikan rekomendasi untuk pengguna dengan profil:

PREFERENSI:
- Minat: ${params.userPreferences.interests.join(', ')}
- Budget: ${params.userPreferences.budgetLevel}
- Mobilitas: ${mobilityText}

KANDIDAT DESTINASI (sudah di-score):
${destinationsList}

Berikan rekomendasi maksimal ${params.limit} destinasi dengan alasan spesifik mengapa cocok untuk pengguna ini.

Output dalam format JSON seperti yang diminta.`;

    return [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ];
  }
}
