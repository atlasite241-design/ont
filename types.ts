export type ONTStatus = 'active' | 'operational' | 'isolated' | 'critical';

export type Theme = 'midnight' | 'ocean' | 'forest' | 'sunset';

export interface ONTRecord {
  id: string;
  msan: string;
  location: string;
  sn: string;
  version: string;
  vendorId: string; // Added field for Vendor ID
  status: ONTStatus; // Derived or simulated for the KPI cards
}

export interface KPIStats {
  searched: number;
  total: number;
  isolated: number;
  critical: number;
  repeated: number;
  huaweiCount?: number;
  nokiaCount?: number;
}

export interface FilterState {
  sn: string;
  location: string;
  msan: string;
  status?: ONTStatus | null;
  showRepeated?: boolean;
  massiveSns?: string[]; // Array of SNs for Massive Search
  vendor?: 'nokia' | 'huawei' | null;
}

export interface User {
  username: string;
  role?: string;
  password?: string;
  createdAt?: string;
  securityQuestion?: string;
  securityAnswer?: string;
  is_blocked?: boolean;
  is_approved?: boolean;
  ip_address?: string;
  city?: string;
  user_agent?: string;
}

export interface ConnectionLog {
  id: number;
  username: string;
  ip_address: string;
  login_time: string;
  last_active: string;
  duration_seconds: number;
  role?: string;
}