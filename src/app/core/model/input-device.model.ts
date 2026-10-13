export interface InputSourceType {
  key: string;
  displayName: string;
  configSchema: { type?: string; properties?: Record<string, InputConfigProperty> };
  capabilities: string[];
}

export interface InputConfigProperty {
  type: 'string' | 'integer' | 'number' | 'boolean';
  enum?: string[];
  minimum?: number;
  maximum?: number;
  maxLength?: number;
}

export interface InputDevice {
  id: number;
  name: string;
  typeKey: string;
  ownerUsername: string | null;
  station: string | null;
  config: Record<string, unknown>;
  capabilities: string[];
  enabled: boolean;
  revoked: boolean;
  createdAt: string;
  updatedAt: string;
  lastSeenAt: string | null;
  version: number;
}

export interface ProvisionedInputDevice {
  device: InputDevice;
  token: string;
}

export interface InputDeviceAuditEvent {
  id: number;
  actorUsername: string;
  action: string;
  details: Record<string, unknown>;
  remoteAddress: string | null;
  occurredAt: string;
}

export interface InputFormPolicy {
  formKey: string;
  station: string;
  allowedSources: string[];
  defaultSource: string;
  scope: 'system-default' | 'global' | 'user';
  updatedBy: string | null;
  updatedAt: string | null;
  version: number;
}

export interface SaveInputFormPolicy {
  allowedSources: string[];
  defaultSource: string;
  station?: string;
  ownerUsername?: string;
}
