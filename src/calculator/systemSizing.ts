import type { BatteryChemistry, CalculatorSettings, Requirements, SelectedAppliance, SystemType } from '../types';
import { requiredBatteryWhByChemistry } from './batterySizing';
import {
  backupEnergyWh,
  estimateSimultaneousLoadW,
  estimateSurgeLoadW,
  safeNumber,
  totalConnectedLoadW,
  totalDailyEnergyWh,
  whToKwh,
} from './energyCalculations';
import { requiredInverterCapacity, type InverterRequirement } from './inverterSizing';
import { requiredPvCapacityW } from './panelSizing';

/** Minimum backup applied to off-grid systems so they can run through the night. */
export const OFF_GRID_MIN_BACKUP_HOURS = 12;

export interface SizingResult {
  connectedLoadW: number;
  simultaneousLoadW: number;
  surgeLoadW: number;
  dailyEnergyWh: number;
  dailyEnergyKwh: number;
  systemType: SystemType;
  systemTypeAutoSelected: boolean;
  needsBattery: boolean;
  /** Backup hours actually used for sizing (may differ from requested – see notes). */
  backupHours: number;
  requestedBackupHours: number;
  backupEnergyWh: number;
  batteryWhByChemistry: Record<BatteryChemistry, number>;
  inverter: InverterRequirement;
  requiredPvW: number;
  notes: string[];
}

/**
 * Pure technical sizing – no products and no prices are involved here.
 */
export function sizeSystem(appliances: SelectedAppliance[], req: Requirements, s: CalculatorSettings): SizingResult {
  const notes: string[] = [];
  const connectedLoadW = totalConnectedLoadW(appliances);
  const dailyEnergyWh = totalDailyEnergyWh(appliances);
  const simultaneousLoadW = estimateSimultaneousLoadW(appliances, req.allSimultaneous, s.diversityFactor);
  const surgeLoadW = estimateSurgeLoadW(appliances, simultaneousLoadW);

  const systemTypeAutoSelected = req.systemType === 'recommend';
  const systemType: SystemType = systemTypeAutoSelected ? s.recommendedSystemType : (req.systemType as SystemType);
  if (systemTypeAutoSelected) {
    notes.push(`We recommended a ${systemType} system based on typical grid conditions and your backup needs.`);
  }

  const requestedBackupHours = Math.min(safeNumber(req.backupHours, 168), s.maxBackupHours);
  let effectiveBackup = requestedBackupHours;
  if (systemType === 'grid-tied') {
    if (requestedBackupHours > 0) notes.push('Grid-tied systems have no batteries, so no backup is provided during power outages.');
    effectiveBackup = 0;
  } else if (systemType === 'off-grid' && effectiveBackup < OFF_GRID_MIN_BACKUP_HOURS) {
    effectiveBackup = OFF_GRID_MIN_BACKUP_HOURS;
    notes.push(`Off-grid systems need batteries for night-time use, so at least ${OFF_GRID_MIN_BACKUP_HOURS} hours of backup was assumed.`);
  }

  const needsBattery = systemType !== 'grid-tied' && effectiveBackup > 0;
  const backupWh = needsBattery ? backupEnergyWh(appliances, effectiveBackup) : 0;

  if (!req.allSimultaneous && appliances.length > 1) {
    notes.push(
      `Not all appliances run at once, so peak load was estimated as your largest appliance plus ${Math.round(s.diversityFactor * 100)}% of the rest.`,
    );
  }

  return {
    connectedLoadW,
    simultaneousLoadW,
    surgeLoadW,
    dailyEnergyWh,
    dailyEnergyKwh: whToKwh(dailyEnergyWh),
    systemType,
    systemTypeAutoSelected,
    needsBattery,
    backupHours: effectiveBackup,
    requestedBackupHours,
    backupEnergyWh: backupWh,
    batteryWhByChemistry: requiredBatteryWhByChemistry(backupWh, s),
    inverter: requiredInverterCapacity(simultaneousLoadW, surgeLoadW, s),
    requiredPvW: requiredPvCapacityW(dailyEnergyWh, backupWh, s),
    notes,
  };
}
