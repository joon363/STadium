import { FoodTruckItem } from '../types/stadium';
import { ARCHIVED_SNAPSHOT } from '../data/archivedSnapshot';

export async function getSupabaseFoodTrucks(_forceRefresh = false): Promise<FoodTruckItem[]> {
  return ARCHIVED_SNAPSHOT.foodTrucks;
}

export async function upsertSupabaseFoodTruck(
  _truck: Partial<FoodTruckItem>
): Promise<{ success: boolean; error?: string }> {
  return { success: true };
}

export async function deleteSupabaseFoodTruck(
  _id: number | string
): Promise<{ success: boolean; error?: string }> {
  return { success: true };
}
