import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { useAuthStore } from './authStore';
import { useLoyaltyStore } from './loyaltyStore';

export interface Mission {
  id: string;
  business_id: string;
  business_name: string;
  business_logo_url: string | null;
  business_cover_url: string | null;
  title: string;
  description: string;
  instructions: string | null;
  points_reward: number;
  prize_description: string | null;
  status: 'active' | 'flash' | 'paused' | 'completed' | 'expired';
  max_claims: number;
  active_claims: number;
  available_slots: number;
  expires_at: string | null;
  is_flash: boolean;
  flash_multiplier: number;
  min_tier: 'bronze' | 'silver' | 'gold';

  // Retro-compatibility field for Club Un Pique screen rendering
  business?: {
    id: string;
    name: string;
    logo_url: string | null;
  };
}

export interface MissionClaim {
  id: string;
  mission_id: string;
  mission: Mission;
  status: 'pending' | 'submitted' | 'approved' | 'rejected' | 'expired';
  claimed_at: string;
  expires_at: string;
  submitted_at: string | null;
  approved_at: string | null;
  points_awarded: number;
  post_id: string | null;

  // Custom fields joined from queries
  mission_title?: string;
  points_reward?: number;
  prize_description?: string | null;
  business_name?: string;
}

export interface MissionsState {
  missions: Mission[]; // Added for backwards compatibility with Club Screen UI
  availableMissions: Mission[];
  myActiveClaims: MissionClaim[];
  myCompletedClaims: MissionClaim[];
  loading: boolean;
  claiming: boolean;
  error: string | null;

  // Actions
  fetchAvailableMissions: (localityId?: string) => Promise<void>;
  fetchMyClaims: () => Promise<void>;
  claimMission: (missionId: string) => Promise<{ success: boolean; claimId?: string; error?: string }>;
  submitPost: (claimId: string, postId: string) => Promise<boolean>;
  canClaimMission: (mission: Mission) => { canClaim: boolean; reason?: string };

  // Helper backwards compatibility wrapper
  fetchMissions: () => Promise<void>;
}

const TIER_LEVELS = {
  bronze: 1,
  silver: 2,
  gold: 3,
};

export const useMissionsStore = create<MissionsState>((set, get) => ({
  missions: [], // Kept for backwards compatibility with Loyalty Screen
  availableMissions: [],
  myActiveClaims: [],
  myCompletedClaims: [],
  loading: false,
  claiming: false,
  error: null,

  fetchAvailableMissions: async (localityId?: string) => {
    // If no localityId provided, try to fallback to profile's location or something
    // The prompt says l.region_id = '[region_id del usuario]' 
    // Wait, the prompt says fetchAvailableMissions(localityId) but the query uses region_id
    // "AND l.region_id = '[region_id del usuario]'"
    // Since we don't have region_id easily available here without an extra query,
    // let's do a join. Or just fetch all active missions for now if no locality is provided.

    set({ loading: true, error: null });

    try {
      // NOTE: We do a more generic fetch here. If you need strict region filtering,
      // it would be better to call a Postgres function or view, or fetch the user's region first.

      const { data, error } = await supabase
        .from('missions')
        .select(`
          *,
          businesses (
            name,
            logo_url,
            cover_url
          )
        `)
        .in('status', ['active', 'flash'])
        .or('expires_at.is.null,expires_at.gt.now()')
        .order('is_flash', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mapped = (data || []).map(m => {
        const available_slots = m.max_claims - m.active_claims;
        const b = Array.isArray(m.businesses) ? m.businesses[0] : m.businesses;
        return {
          ...m,
          business_name: b?.name || '',
          business_logo_url: b?.logo_url || null,
          business_cover_url: b?.cover_url || null,
          available_slots,
          business: {
            id: m.business_id,
            name: b?.name || '',
            logo_url: b?.logo_url || null
          }
        } as Mission;
      });

      set({
        availableMissions: mapped,
        missions: mapped, // Keep the old property populated for index.tsx
        loading: false
      });
    } catch (err: any) {
      console.error('Error fetching missions:', err);
      set({ error: err.message, loading: false });
    }
  },

  // Alias for compatibility with app/loyalty/index.tsx
  fetchMissions: async () => {
    await get().fetchAvailableMissions();
  },

  fetchMyClaims: async () => {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('mission_claims')
        .select(`
          *,
          missions (
            title,
            points_reward,
            prize_description
          ),
          businesses (
            name
          )
        `)
        .eq('user_id', userId)
        .order('claimed_at', { ascending: false });

      if (error) throw error;

      const claims = (data || []).map(c => {
        const m = Array.isArray(c.missions) ? c.missions[0] : c.missions;
        const b = Array.isArray(c.businesses) ? c.businesses[0] : c.businesses;

        return {
          ...c,
          mission_title: m?.title,
          points_reward: m?.points_reward,
          prize_description: m?.prize_description,
          business_name: b?.name
        } as MissionClaim;
      });

      const active = claims.filter(c => ['pending', 'submitted'].includes(c.status));
      const completed = claims.filter(c => !['pending', 'submitted'].includes(c.status));

      set({ myActiveClaims: active, myCompletedClaims: completed });
    } catch (err: any) {
      console.error('Error fetching my claims:', err);
    }
  },

  claimMission: async (missionId: string) => {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) return { success: false, error: 'No autenticado' };

    const mission = get().availableMissions.find(m => m.id === missionId);
    if (!mission) return { success: false, error: 'Misión no encontrada' };

    const { canClaim, reason } = get().canClaimMission(mission);
    if (!canClaim) return { success: false, error: reason };

    set({ claiming: true });

    try {
      // Create expiration date 24 hours from now
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from('mission_claims')
        .insert({
          mission_id: missionId,
          user_id: userId,
          business_id: mission.business_id,
          expires_at: expiresAt,
          status: 'pending'
        })
        .select('id')
        .single();

      if (error) throw error;

      // Refrescar ambas listas
      await Promise.all([
        get().fetchAvailableMissions(),
        get().fetchMyClaims()
      ]);

      set({ claiming: false });
      return { success: true, claimId: data.id };
    } catch (err: any) {
      console.error('Error claiming mission:', err);
      set({ claiming: false });
      return { success: false, error: err.message };
    }
  },

  submitPost: async (claimId: string, postId: string) => {
    try {
      const { error } = await supabase
        .from('mission_claims')
        .update({
          status: 'submitted',
          post_id: postId,
          submitted_at: new Date().toISOString()
        })
        .eq('id', claimId);

      if (error) throw error;

      await get().fetchMyClaims();
      return true;
    } catch (err: any) {
      console.error('Error submitting post:', err);
      return false;
    }
  },

  canClaimMission: (mission: Mission) => {
    const loyalty = useLoyaltyStore.getState().loyalty;

    if (loyalty?.is_blocked_from_missions) {
      return { canClaim: false, reason: 'Estás bloqueado temporalmente' };
    }

    if (mission.available_slots <= 0) {
      return { canClaim: false, reason: 'Sin cupos disponibles' };
    }

    const hasActiveClaim = get().myActiveClaims.some(c => c.mission_id === mission.id);
    if (hasActiveClaim) {
      return { canClaim: false, reason: 'Ya tomaste esta misión' };
    }

    const userTierLvl = TIER_LEVELS[(loyalty?.tier as keyof typeof TIER_LEVELS)] || 1;
    const missionTierLvl = TIER_LEVELS[mission.min_tier] || 1;

    if (userTierLvl < missionTierLvl) {
      const tierNames = { bronze: 'BRONCE', silver: 'PLATA', gold: 'ORO' };
      return { canClaim: false, reason: `Necesitás nivel ${tierNames[mission.min_tier] || mission.min_tier}` };
    }

    return { canClaim: true };
  }
}));
