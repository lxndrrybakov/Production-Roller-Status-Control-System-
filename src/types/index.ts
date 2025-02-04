export type RollerStatusMap = {
  [key: string]: number;
};

export interface MaintenanceRecord {
  id: string;
  roller_number: number;
  line_number: number;
  reason: string;
  custom_reason?: string;
  date: string;
}

export interface JammingRecord {
  id: string;
  roller_number: number;
  line_number: number;
  reason: string;
  custom_reason?: string;
  date: string;
  resolved: boolean;
  resolved_at?: string;
}

export interface ShiftNote {
  id: string;
  content: string;
  date: string;
}

export interface RollerSection {
  name: string;
  startRoller: number;
  endRoller: number;
}