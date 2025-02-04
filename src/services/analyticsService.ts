import { supabase } from '../config/supabase';
import { ServiceRole } from '../store/authStore';

export interface FailurePrediction {
  roller_number: number;
  probability: number;
  predicted_days: number;
  confidence: number;
  likely_reasons?: {
    reason: string;
    probability: number;
  }[];
}

class AnalyticsService {
  async getFrequentIssues(serviceType: string | null) {
    try {
      const { data, error } = await supabase
        .rpc('count_issues_by_reason', {
          p_service_type: serviceType
        });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching frequent issues:', error);
      return [];
    }
  }

  async getProblemRollers(serviceType: string | null) {
    try {
      const { data, error } = await supabase
        .rpc('count_issues_by_roller', {
          p_service_type: serviceType
        });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching problem rollers:', error);
      return [];
    }
  }

  async getPredictions(serviceType: string | null): Promise<FailurePrediction[]> {
    try {
      const { data, error } = await supabase
        .rpc('predict_failures', {
          p_service_type: serviceType
        });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching predictions:', error);
      return [];
    }
  }
}

export const analyticsService = new AnalyticsService();