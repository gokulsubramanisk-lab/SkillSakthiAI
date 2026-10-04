import { seedDatabase } from "./seed";

let isInitialized = false;

export async function ensureDbInitialized() {
  if (isInitialized) return;
  try {
    await seedDatabase();
    isInitialized = true;
  } catch (err) {
    console.error("Failed to seed database:", err);
  }
}
