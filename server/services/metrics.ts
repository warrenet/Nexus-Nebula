import type { MetricsData } from '../types';

const metrics: MetricsData = {
  missionsTotal: 0,
  missionsSuccess: 0,
  missionsFailed: 0,
  swarmAgentsActive: 0,
  costTotal: 0,
  redTeamFlagsTotal: 0,
  requestDurations: [],
};

export function incrementMissionsTotal(): void {
  metrics.missionsTotal++;
}

export function incrementMissionsSuccess(): void {
  metrics.missionsSuccess++;
}

export function incrementMissionsFailed(): void {
  metrics.missionsFailed++;
}

export function setSwarmAgentsActive(count: number): void {
  metrics.swarmAgentsActive = count;
}

export function addCost(cost: number): void {
  metrics.costTotal += cost;
}

export function incrementRedTeamFlags(count: number): void {
  metrics.redTeamFlagsTotal += count;
}

export function recordRequestDuration(durationMs: number): void {
  metrics.requestDurations.push(durationMs);
  if (metrics.requestDurations.length > 1000) {
    metrics.requestDurations.shift();
  }
}

export function getMetrics(): MetricsData {
  return { ...metrics };
}

export function formatPrometheusMetrics(): string {
  const lines: string[] = [];
  
  lines.push('# HELP nexus_missions_total Total number of missions executed');
  lines.push('# TYPE nexus_missions_total counter');
  lines.push(`nexus_missions_total ${metrics.missionsTotal}`);
  
  lines.push('# HELP nexus_missions_success_total Total number of successful missions');
  lines.push('# TYPE nexus_missions_success_total counter');
  lines.push(`nexus_missions_success_total ${metrics.missionsSuccess}`);
  
  lines.push('# HELP nexus_missions_failed_total Total number of failed missions');
  lines.push('# TYPE nexus_missions_failed_total counter');
  lines.push(`nexus_missions_failed_total ${metrics.missionsFailed}`);
  
  lines.push('# HELP nexus_swarm_agents_active Number of currently active swarm agents');
  lines.push('# TYPE nexus_swarm_agents_active gauge');
  lines.push(`nexus_swarm_agents_active ${metrics.swarmAgentsActive}`);
  
  lines.push('# HELP nexus_cost_total Total API costs in USD');
  lines.push('# TYPE nexus_cost_total counter');
  lines.push(`nexus_cost_total ${metrics.costTotal.toFixed(6)}`);
  
  lines.push('# HELP nexus_red_team_flags_total Total number of red team flags triggered');
  lines.push('# TYPE nexus_red_team_flags_total counter');
  lines.push(`nexus_red_team_flags_total ${metrics.redTeamFlagsTotal}`);
  
  if (metrics.requestDurations.length > 0) {
    const sorted = [...metrics.requestDurations].sort((a, b) => a - b);
    const p50 = sorted[Math.floor(sorted.length * 0.5)] || 0;
    const p90 = sorted[Math.floor(sorted.length * 0.9)] || 0;
    const p99 = sorted[Math.floor(sorted.length * 0.99)] || 0;
    
    lines.push('# HELP nexus_request_duration_seconds Request duration in seconds');
    lines.push('# TYPE nexus_request_duration_seconds summary');
    lines.push(`nexus_request_duration_seconds{quantile="0.5"} ${(p50 / 1000).toFixed(3)}`);
    lines.push(`nexus_request_duration_seconds{quantile="0.9"} ${(p90 / 1000).toFixed(3)}`);
    lines.push(`nexus_request_duration_seconds{quantile="0.99"} ${(p99 / 1000).toFixed(3)}`);
    lines.push(`nexus_request_duration_seconds_count ${metrics.requestDurations.length}`);
    lines.push(`nexus_request_duration_seconds_sum ${(metrics.requestDurations.reduce((a, b) => a + b, 0) / 1000).toFixed(3)}`);
  }
  
  return lines.join('\n');
}
