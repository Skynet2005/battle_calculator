/**
 * Command Center Building Data
 * Levels 1-FC10 with Rally Capacity and Troops Deployment Capacity
 */

export interface CommandCenterLevel {
  level: string; // "1", "2", ..., "9", "10", ..., "19", "20", ..., "30", "FC1", "FC2", ..., "FC10"
  rallyCapacity: number; // Rally Capacity bonus
  deploymentCapacity: number; // Troops Deployment Capacity bonus
}

export const COMMAND_CENTER_DATA: CommandCenterLevel[] = [
  // Levels 1-9
  { level: "1", rallyCapacity: 1500, deploymentCapacity: 400 },
  { level: "2", rallyCapacity: 3500, deploymentCapacity: 700 },
  { level: "3", rallyCapacity: 5700, deploymentCapacity: 1000 },
  { level: "4", rallyCapacity: 8000, deploymentCapacity: 1400 },
  { level: "5", rallyCapacity: 11500, deploymentCapacity: 1800 },
  { level: "6", rallyCapacity: 15000, deploymentCapacity: 2800 },
  { level: "7", rallyCapacity: 19000, deploymentCapacity: 3800 },
  { level: "8", rallyCapacity: 24000, deploymentCapacity: 5000 },
  { level: "9", rallyCapacity: 29500, deploymentCapacity: 6500 },

  // Levels 10-19
  { level: "10", rallyCapacity: 35500, deploymentCapacity: 8000 },
  { level: "11", rallyCapacity: 43500, deploymentCapacity: 10500 },
  { level: "12", rallyCapacity: 52000, deploymentCapacity: 13000 },
  { level: "13", rallyCapacity: 62000, deploymentCapacity: 16000 },
  { level: "14", rallyCapacity: 73500, deploymentCapacity: 19000 },
  { level: "15", rallyCapacity: 87500, deploymentCapacity: 22000 },
  { level: "16", rallyCapacity: 105000, deploymentCapacity: 27000 },
  { level: "17", rallyCapacity: 120000, deploymentCapacity: 32000 },
  { level: "18", rallyCapacity: 140000, deploymentCapacity: 34000 },
  { level: "19", rallyCapacity: 165000, deploymentCapacity: 36000 },

  // Levels 20-30
  { level: "20", rallyCapacity: 195000, deploymentCapacity: 38000 },
  { level: "21", rallyCapacity: 225000, deploymentCapacity: 40500 },
  { level: "22", rallyCapacity: 260000, deploymentCapacity: 43000 },
  { level: "23", rallyCapacity: 305000, deploymentCapacity: 46000 },
  { level: "24", rallyCapacity: 350000, deploymentCapacity: 48500 },
  { level: "25", rallyCapacity: 400000, deploymentCapacity: 52000 },
  { level: "26", rallyCapacity: 470000, deploymentCapacity: 54500 },
  { level: "27", rallyCapacity: 550000, deploymentCapacity: 57000 },
  { level: "28", rallyCapacity: 630000, deploymentCapacity: 60500 },
  { level: "29", rallyCapacity: 725000, deploymentCapacity: 64000 },
  { level: "30", rallyCapacity: 840000, deploymentCapacity: 67000 },

  // FC Levels (FC1-FC10)
  { level: "FC1", rallyCapacity: 865000, deploymentCapacity: 70500 },
  { level: "FC2", rallyCapacity: 890000, deploymentCapacity: 74000 },
  { level: "FC3", rallyCapacity: 915000, deploymentCapacity: 77500 },
  { level: "FC4", rallyCapacity: 940000, deploymentCapacity: 81000 },
  { level: "FC5", rallyCapacity: 965000, deploymentCapacity: 84500 },
  { level: "FC6", rallyCapacity: 990000, deploymentCapacity: 88000 },
  { level: "FC7", rallyCapacity: 1015000, deploymentCapacity: 91500 },
  { level: "FC8", rallyCapacity: 1040000, deploymentCapacity: 95000 },
  { level: "FC9", rallyCapacity: 1065000, deploymentCapacity: 98500 },
  { level: "FC10", rallyCapacity: 1090000, deploymentCapacity: 102000 },
];

/**
 * Get Command Center level data
 */
export function getCommandCenterLevel(level: string): CommandCenterLevel | undefined {
  return COMMAND_CENTER_DATA.find(l => l.level === level);
}

/**
 * Get all Command Center levels
 */
export function getAllCommandCenterLevels(): CommandCenterLevel[] {
  return COMMAND_CENTER_DATA;
}

