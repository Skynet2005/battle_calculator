import { boolean, integer, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { users } from './users';

/**
 * Battle Results Schema
 *
 * Stores simulation runs/results for logged-in users.
 */
export const battleResults = pgTable('battle_results', {
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
});

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
