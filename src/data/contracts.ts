export interface CreateDogInput {
  dog_name: string;
  dog_breed_id: string;
  dog_birth_date: string;
  kennel_code?: string | null;
}

export type EventType = 'pee' | 'poop' | 'food' | 'sleep' | 'awake' | 'walk' | 'accident' | 'water'
  | 'weight' | 'vaccination' | 'vet_visit';

export interface TimedDogEventInput {
  id: string;
  dog_id: string;
  event_type: Exclude<EventType, 'weight' | 'vaccination' | 'vet_visit'>;
  occurred_at: string;
  duration_minutes?: number;
}

// The Supabase client and generated database types are added with the app task.
// This file does not claim to execute requests or persist data.
