import { boolean, integer, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { profiles } from './profiles';
import { users } from './users';

/**
 * Battle Results Schema
 *
 * Stores simulation runs/results for logged-in users.
 * Extended for decision engine: snapshot, tags, share token, run type.
 */
export const battleResults = pgTable(
  'battle_results',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    inputHash: text('input_hash').notNull(),
    requestJson: jsonb('request_json').notNull(),
    responseSummaryJson: jsonb('response_summary_json'),
    timelineJson: jsonb('timeline_json'),
    metricsJson: jsonb('metrics_json'),
    rationaleJson: jsonb('rationale_json'),
    reportJson: jsonb('report_json'), // Optional, can store summary only
    // Decision engine: saved run snapshot + permalink
    playerProfileId: uuid('player_profile_id').references(() => profiles.id, { onDelete: 'set null' }),
    opponentProfileId: uuid('opponent_profile_id').references(() => profiles.id, { onDelete: 'set null' }),
    rallyConfigSnapshot: jsonb('rally_config_snapshot'),
    battleConfigSnapshot: jsonb('battle_config_snapshot'),
    tags: jsonb('tags'), // string[]
    modelVersion: text('model_version'),
    shareToken: text('share_token'), // unique, for read-only permalink
    runType: text('run_type'), // 'single' | 'batch_row' | 'heatmap_cell' | 'scenario_baseline'
  },
  (table) => ({
    shareTokenUnique: uniqueIndex('battle_results_share_token_unique').on(table.shareToken),
  })
);

/**
 * Battle Simulation Log Schema
 *
 * Audit log for simulation requests (for analytics and debugging).
 */
export const battleSimulationLog = pgTable('battle_simulation_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  inputHash: text('input_hash').notNull(),
  latencyMs: integer('latency_ms'),
  cacheHit: boolean('cache_hit').default(false),
  errorMessage: text('error_message'),
  requestJson: jsonb('request_json'),
  responseJson: jsonb('response_json'), // Summary only
});
