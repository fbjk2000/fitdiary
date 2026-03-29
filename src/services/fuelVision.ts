import * as FileSystem from 'expo-file-system/legacy';
import { PhotoNutritionEstimate } from '../types/app';

type FuelVisionResponse = {
  error?: string;
  details?: string;
  label?: string;
  calories?: number | string;
  protein?: number | string;
  carbs?: number | string;
  fat?: number | string;
  confidence?: number;
  notes?: string;
};

const normalizeNumber = (value: number | string | undefined) => {
  if (value === undefined || value === null || value === '') return '';
  return typeof value === 'number' ? String(Math.round(value)) : String(value).trim();
};

const mimeTypeFromUri = (uri: string) => {
  const normalized = uri.toLowerCase();
  if (normalized.endsWith('.png')) return 'image/png';
  if (normalized.endsWith('.webp')) return 'image/webp';
  if (normalized.endsWith('.heic') || normalized.endsWith('.heif')) return 'image/heic';
  return 'image/jpeg';
};

export const fuelVisionConfigured = () => Boolean(process.env.EXPO_PUBLIC_FITDIARY_VISION_ENDPOINT);

export async function analyzeFuelPhoto(photoUri: string): Promise<PhotoNutritionEstimate> {
  const endpoint = process.env.EXPO_PUBLIC_FITDIARY_VISION_ENDPOINT;
  if (!endpoint) {
    throw new Error('Fuel vision endpoint not configured');
  }

  const imageBase64 = await FileSystem.readAsStringAsync(photoUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 75000);

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageBase64,
        mimeType: mimeTypeFromUri(photoUri),
        task: 'estimate_nutrition',
        units: {
          calories: 'kcal',
          protein: 'g',
          carbs: 'g',
          fat: 'g',
        },
      }),
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(
        'Fuel vision request timed out. The meal-photo service may have been waking from inactivity, so please try once more in a few seconds.'
      );
    }
    throw new Error('Fuel vision endpoint is unreachable');
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as FuelVisionResponse | null;
    const message = payload?.details || payload?.error;
    if (message) {
      throw new Error(message);
    }
    throw new Error(`Fuel vision request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as FuelVisionResponse;

  return {
    label: payload.label?.trim() || 'Photo estimate',
    calories: normalizeNumber(payload.calories),
    protein: normalizeNumber(payload.protein),
    carbs: normalizeNumber(payload.carbs),
    fat: normalizeNumber(payload.fat),
    confidence: payload.confidence,
    notes: payload.notes?.trim(),
  };
}
