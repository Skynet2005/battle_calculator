import { sql } from 'drizzle-orm';
import { boolean, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { battleResults } from './battle_results';
import { users } from './users';

/**
 * Calibration parameters - versioned calibration overrides per user (admin).
 */
export const calibrationParameters = pgTable('calibration_parameters', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  version: text('version').notNull(),
  name: text('name').notNull(),
  paramsJson: jsonb('params_json').notNull(), // { calibrationConstantK?, troopCountExponentAlpha?, matchupMultipliers? }
  createdAt: timestamp('created_at', { withTimezone: false }).default(sql`now()`).notNull(),
  isActive: boolean('is_active').notNull().default(false),
});

/**
 * Battle report imports - pasted in-game report summaries for calibration.
 */
export const battleReportImports = pgTable('battle_report_imports', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  rawText: text('raw_text').notNull(),
  parsedJson: jsonb('parsed_json'), // { winner?, troopTotals?, remaining?, turnCount?, lineupText? }
  linkedBattleResultId: uuid('linked_battle_result_id').references(() => battleResults.id, {
    onDelete: 'set null',
  }),
  createdAt: timestamp('created_at', { withTimezone: false }).default(sql`now()`).notNull(),
});

/**
 * Calibration observations - predicted vs observed for dashboard metrics.
 */
export const calibrationObservations = pgTable('calibration_observations', {
  id: uuid('id').primaryKey().defaultRandom(),
  reportImportId: uuid('report_import_id')
    .references(() => battleReportImports.id, { onDelete: 'cascade' })
    .notNull(),
  predictedWinner: text('predicted_winner').notNull(),
  observedWinner: text('observed_winner').notNull(),
  predictedRemainingJson: jsonb('predicted_remaining_json'),
  observedRemainingJson: jsonb('observed_remaining_json'),
  winCorrect: boolean('win_correct').notNull(),
  remainingErrorJson: jsonb('remaining_error_json'),
});
