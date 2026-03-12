//! Dashboard REST API endpoints for the ZeroClaw monitoring frontend.
//!
//! All endpoints are mounted under `/api/` and return JSON.
//! These endpoints are unauthenticated (dashboard auth is handled separately).

use crate::memory::{Memory, MemoryCategory};
use crate::observability::traits::{ObserverEvent, ObserverMetric};
use axum::{
    extract::{Query, State},
    http::{header, Method},
    response::IntoResponse,
    routing::get,
    Json, Router,
};
use parking_lot::Mutex;
use serde::{Deserialize, Serialize};
use chrono::Utc;
use std::collections::{HashMap, VecDeque};
use std::sync::Arc;
use std::time::{Duration, Instant, SystemTime};
use tower_http::cors::{AllowOrigin, CorsLayer};
use uuid::Uuid;

// ══════════════════════════════════════════════════════════════════════════════
// DASHBOARD METRICS COLLECTOR
// ══════════════════════════════════════════════════════════════════════════════

/// In-memory metrics collected from observer events for dashboard display.
#[derive(Debug)]
pub struct DashboardMetrics {
    pub start_time: Instant,
    inner: Mutex<MetricsInner>,
}

#[derive(Debug, Default)]
struct MetricsInner {
    tokens_in: u64,
    tokens_out: u64,
    tokens_by_provider: HashMap<String, TokenPair>,
    total_requests: u64,
    request_timestamps: VecDeque<Instant>,
    total_tool_calls: u64,
    tool_calls_by_name: HashMap<String, u64>,
    total_cost_usd: f64,
    cost_timestamps: VecDeque<(Instant, f64)>,
    channel_messages: HashMap<String, ChannelMessageCounts>,
}

#[derive(Debug, Default, Clone)]
struct TokenPair {
    r#in: u64,
    out: u64,
}

#[derive(Debug, Default, Clone)]
struct ChannelMessageCounts {
    received: u64,
    sent: u64,
    last_activity: Option<Instant>,
}

impl DashboardMetrics {
    pub fn new() -> Self {
        Self {
            start_time: Instant::now(),
            inner: Mutex::new(MetricsInner::default()),
        }
    }

    /// Record an observer event into dashboard metrics.
    pub fn record_event(&self, event: &ObserverEvent) {
        let mut m = self.inner.lock();
        let now = Instant::now();

        match event {
            ObserverEvent::LlmRequest { .. } => {
                m.total_requests += 1;
                m.request_timestamps.push_back(now);
                // Prune timestamps older than 24h
                let cutoff = now - Duration::from_secs(86_400);
                while m.request_timestamps.front().is_some_and(|t| *t < cutoff) {
                    m.request_timestamps.pop_front();
                }
            }
            ObserverEvent::AgentEnd {
                tokens_used,
                cost_usd,
                provider,
                ..
            } => {
                if let Some(tokens) = tokens_used {
                    // Rough split: 60% input, 40% output
                    let t_in = (*tokens as f64 * 0.6) as u64;
                    let t_out = tokens.saturating_sub(t_in);
                    m.tokens_in += t_in;
                    m.tokens_out += t_out;
                    let entry = m.tokens_by_provider.entry(provider.clone()).or_default();
                    entry.r#in += t_in;
                    entry.out += t_out;
                }
                if let Some(cost) = cost_usd {
                    m.total_cost_usd += cost;
                    m.cost_timestamps.push_back((now, *cost));
                    let cutoff = now - Duration::from_secs(86_400);
                    while m.cost_timestamps.front().is_some_and(|(t, _)| *t < cutoff) {
                        m.cost_timestamps.pop_front();
                    }
                }
            }
            ObserverEvent::ToolCall { tool, .. } => {
                m.total_tool_calls += 1;
                *m.tool_calls_by_name.entry(tool.clone()).or_insert(0) += 1;
            }
            ObserverEvent::ChannelMessage {
                channel,
                direction,
            } => {
                let entry = m.channel_messages.entry(channel.clone()).or_default();
                if direction == "inbound" || direction == "received" {
                    entry.received += 1;
                } else {
                    entry.sent += 1;
                }
                entry.last_activity = Some(now);
            }
            _ => {}
        }
    }

    pub fn record_metric(&self, metric: &ObserverMetric) {
        if let ObserverMetric::TokensUsed(tokens) = metric {
            let mut m = self.inner.lock();
            m.tokens_in += tokens / 2;
            m.tokens_out += tokens / 2;
        }
    }
}

// ══════════════════════════════════════════════════════════════════════════════
// DASHBOARD LOG STORE (ring buffer)
// ══════════════════════════════════════════════════════════════════════════════

const MAX_LOG_ENTRIES: usize = 1_000;

#[derive(Debug, Clone, Serialize)]
pub struct LogEntry {
    pub id: String,
    pub timestamp: String,
    pub level: String,
    pub component: String,
    pub message: String,
    pub metadata: serde_json::Value,
}

#[derive(Debug)]
pub struct DashboardLogStore {
    entries: Mutex<VecDeque<LogEntry>>,
}

impl DashboardLogStore {
    pub fn new() -> Self {
        Self {
            entries: Mutex::new(VecDeque::with_capacity(MAX_LOG_ENTRIES)),
        }
    }

    pub fn push(&self, level: &str, component: &str, message: &str) {
        let entry = LogEntry {
            id: Uuid::new_v4().to_string(),
            timestamp: Utc::now().to_rfc3339(),
            level: level.to_string(),
            component: component.to_string(),
            message: message.to_string(),
            metadata: serde_json::json!({}),
        };
        let mut entries = self.entries.lock();
        if entries.len() >= MAX_LOG_ENTRIES {
            entries.pop_front();
        }
        entries.push_back(entry);
    }

    /// Record observer events as log entries.
    pub fn record_event(&self, event: &ObserverEvent) {
        match event {
            ObserverEvent::LlmRequest {
                provider, model, ..
            } => self.push("info", "provider", &format!("LLM request to {provider}/{model}")),
            ObserverEvent::LlmResponse {
                provider,
                success,
                error_message,
                duration,
                ..
            } => {
                if *success {
                    self.push(
                        "info",
                        "provider",
                        &format!("LLM response from {provider} in {:.1}s", duration.as_secs_f64()),
                    );
                } else {
                    self.push(
                        "error",
                        "provider",
                        &format!(
                            "LLM error from {provider}: {}",
                            error_message.as_deref().unwrap_or("unknown")
                        ),
                    );
                }
            }
            ObserverEvent::ToolCall {
                tool,
                success,
                duration,
            } => {
                let level = if *success { "info" } else { "warn" };
                self.push(
                    level,
                    "tools",
                    &format!(
                        "Tool '{tool}' {} in {:.1}s",
                        if *success { "completed" } else { "failed" },
                        duration.as_secs_f64()
                    ),
                );
            }
            ObserverEvent::ChannelMessage {
                channel,
                direction,
            } => self.push(
                "info",
                "channel",
                &format!("Message {direction} via {channel}"),
            ),
            ObserverEvent::Error {
                component,
                message,
            } => self.push("error", component, message),
            ObserverEvent::AgentStart { provider, model } => {
                self.push("info", "agent", &format!("Agent started ({provider}/{model})"));
            }
            ObserverEvent::AgentEnd { duration, .. } => {
                self.push(
                    "info",
                    "agent",
                    &format!("Agent completed in {:.1}s", duration.as_secs_f64()),
                );
            }
            _ => {}
        }
    }
}

// ══════════════════════════════════════════════════════════════════════════════
// DASHBOARD OBSERVER (wraps another observer + collects for dashboard)
// ══════════════════════════════════════════════════════════════════════════════

/// Observer that delegates to an inner observer while also collecting
/// metrics and logs for the dashboard API.
pub struct DashboardObserver {
    inner: Box<dyn crate::observability::Observer>,
    pub metrics: Arc<DashboardMetrics>,
    pub logs: Arc<DashboardLogStore>,
}

impl DashboardObserver {
    pub fn new(inner: Box<dyn crate::observability::Observer>) -> Self {
        Self {
            inner,
            metrics: Arc::new(DashboardMetrics::new()),
            logs: Arc::new(DashboardLogStore::new()),
        }
    }
}

impl crate::observability::Observer for DashboardObserver {
    fn record_event(&self, event: &ObserverEvent) {
        self.inner.record_event(event);
        self.metrics.record_event(event);
        self.logs.record_event(event);
    }

    fn record_metric(&self, metric: &ObserverMetric) {
        self.inner.record_metric(metric);
        self.metrics.record_metric(metric);
    }

    fn flush(&self) {
        self.inner.flush();
    }

    fn name(&self) -> &str {
        "dashboard"
    }

    fn as_any(&self) -> &dyn std::any::Any {
        self
    }
}

// ══════════════════════════════════════════════════════════════════════════════
// API RESPONSE TYPES
// ══════════════════════════════════════════════════════════════════════════════

#[derive(Serialize)]
struct StatusResponse {
    status: String,
    uptime_secs: u64,
    provider: String,
    model: String,
    memory_backend: String,
    memory_entries: u64,
    channels: HashMap<String, ChannelInfo>,
    gateway: GatewayInfo,
}

#[derive(Serialize)]
struct ChannelInfo {
    active: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    webhook_mode: Option<bool>,
}

#[derive(Serialize)]
struct GatewayInfo {
    host: String,
    port: u16,
}

#[derive(Serialize)]
struct MetricsResponse {
    tokens: TokenMetrics,
    requests: RequestMetrics,
    tools: ToolMetrics,
    cost_usd: CostMetrics,
    uptime_secs: u64,
}

#[derive(Serialize)]
struct TokenMetrics {
    total_in: u64,
    total_out: u64,
    by_provider: HashMap<String, TokenProviderMetrics>,
}

#[derive(Serialize)]
struct TokenProviderMetrics {
    r#in: u64,
    out: u64,
}

#[derive(Serialize)]
struct RequestMetrics {
    total: u64,
    last_24h: u64,
    last_hour: u64,
}

#[derive(Serialize)]
struct ToolMetrics {
    total_calls: u64,
    by_tool: HashMap<String, u64>,
}

#[derive(Serialize)]
struct CostMetrics {
    total: f64,
    last_24h: f64,
}

#[derive(Serialize)]
struct LogsResponse {
    logs: Vec<LogEntry>,
    total: usize,
    has_more: bool,
}

#[derive(Deserialize)]
pub struct LogsQuery {
    limit: Option<usize>,
    offset: Option<usize>,
    level: Option<String>,
}

#[derive(Serialize)]
struct ChannelsResponse {
    channels: Vec<ChannelStatusEntry>,
}

#[derive(Serialize)]
struct ChannelStatusEntry {
    name: String,
    active: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    webhook_mode: Option<bool>,
    messages_received: u64,
    messages_sent: u64,
    last_activity: Option<String>,
}

#[derive(Serialize)]
struct MemoryStatsResponse {
    backend: String,
    total_entries: u64,
    by_category: HashMap<String, u64>,
    health: bool,
}

#[derive(Deserialize)]
pub struct MemoryRecentQuery {
    limit: Option<usize>,
}

#[derive(Serialize)]
struct MemoryRecentResponse {
    entries: Vec<MemoryEntryResponse>,
}

#[derive(Serialize)]
struct MemoryEntryResponse {
    id: String,
    key: String,
    category: String,
    timestamp: String,
    content_preview: String,
}

// ══════════════════════════════════════════════════════════════════════════════
// HANDLERS
// ══════════════════════════════════════════════════════════════════════════════

use super::AppState;

/// GET /api/status
async fn handle_status(State(state): State<AppState>) -> impl IntoResponse {
    let config = state.config.lock();

    let memory_entries = match state.mem.count().await {
        Ok(n) => n as u64,
        Err(_) => 0,
    };

    let mut channels = HashMap::new();
    channels.insert(
        "telegram".to_string(),
        ChannelInfo {
            active: state.telegram.is_some(),
            webhook_mode: Some(
                config
                    .channels_config
                    .telegram
                    .as_ref()
                    .is_some_and(|t| t.webhook_mode),
            ),
        },
    );
    channels.insert(
        "whatsapp".to_string(),
        ChannelInfo {
            active: state.whatsapp.is_some(),
            webhook_mode: None,
        },
    );
    channels.insert(
        "discord".to_string(),
        ChannelInfo {
            active: config.channels_config.discord.is_some(),
            webhook_mode: None,
        },
    );
    channels.insert(
        "slack".to_string(),
        ChannelInfo {
            active: config.channels_config.slack.is_some(),
            webhook_mode: None,
        },
    );

    let uptime = state
        .dashboard_metrics
        .as_ref()
        .map(|m| m.start_time.elapsed().as_secs())
        .unwrap_or(0);

    let resp = StatusResponse {
        status: "running".to_string(),
        uptime_secs: uptime,
        provider: config
            .default_provider
            .clone()
            .unwrap_or_else(|| "openrouter".into()),
        model: state.model.clone(),
        memory_backend: config.memory.backend.clone(),
        memory_entries,
        channels,
        gateway: GatewayInfo {
            host: config.gateway.host.clone(),
            port: config.gateway.port,
        },
    };

    Json(resp)
}

/// GET /api/metrics
async fn handle_api_metrics(State(state): State<AppState>) -> impl IntoResponse {
    let uptime = state
        .dashboard_metrics
        .as_ref()
        .map(|m| m.start_time.elapsed().as_secs())
        .unwrap_or(0);

    let resp = if let Some(ref dm) = state.dashboard_metrics {
        let m = dm.inner.lock();
        let now = Instant::now();
        let hour_ago = now - Duration::from_secs(3600);
        let day_ago = now - Duration::from_secs(86_400);

        let last_hour = m
            .request_timestamps
            .iter()
            .filter(|t| **t >= hour_ago)
            .count() as u64;
        let last_24h = m
            .request_timestamps
            .iter()
            .filter(|t| **t >= day_ago)
            .count() as u64;

        let cost_last_24h: f64 = m
            .cost_timestamps
            .iter()
            .filter(|(t, _)| *t >= day_ago)
            .map(|(_, c)| c)
            .sum();

        MetricsResponse {
            tokens: TokenMetrics {
                total_in: m.tokens_in,
                total_out: m.tokens_out,
                by_provider: m
                    .tokens_by_provider
                    .iter()
                    .map(|(k, v)| {
                        (
                            k.clone(),
                            TokenProviderMetrics {
                                r#in: v.r#in,
                                out: v.out,
                            },
                        )
                    })
                    .collect(),
            },
            requests: RequestMetrics {
                total: m.total_requests,
                last_24h,
                last_hour,
            },
            tools: ToolMetrics {
                total_calls: m.total_tool_calls,
                by_tool: m.tool_calls_by_name.clone(),
            },
            cost_usd: CostMetrics {
                total: m.total_cost_usd,
                last_24h: cost_last_24h,
            },
            uptime_secs: uptime,
        }
    } else {
        MetricsResponse {
            tokens: TokenMetrics {
                total_in: 0,
                total_out: 0,
                by_provider: HashMap::new(),
            },
            requests: RequestMetrics {
                total: 0,
                last_24h: 0,
                last_hour: 0,
            },
            tools: ToolMetrics {
                total_calls: 0,
                by_tool: HashMap::new(),
            },
            cost_usd: CostMetrics {
                total: 0.0,
                last_24h: 0.0,
            },
            uptime_secs: uptime,
        }
    };

    Json(resp)
}

/// GET /api/logs
async fn handle_logs(
    State(state): State<AppState>,
    Query(query): Query<LogsQuery>,
) -> impl IntoResponse {
    let limit = query.limit.unwrap_or(50).min(200);
    let offset = query.offset.unwrap_or(0);

    let resp = if let Some(ref log_store) = state.dashboard_logs {
        let entries = log_store.entries.lock();
        let filtered: Vec<&LogEntry> = entries
            .iter()
            .rev() // newest first
            .filter(|e| {
                query
                    .level
                    .as_ref()
                    .map_or(true, |l| l == "all" || e.level == *l)
            })
            .collect();

        let total = filtered.len();
        let page: Vec<LogEntry> = filtered
            .into_iter()
            .skip(offset)
            .take(limit)
            .cloned()
            .collect();
        let has_more = offset + page.len() < total;

        LogsResponse {
            logs: page,
            total,
            has_more,
        }
    } else {
        LogsResponse {
            logs: vec![],
            total: 0,
            has_more: false,
        }
    };

    Json(resp)
}

/// GET /api/channels
async fn handle_channels(State(state): State<AppState>) -> impl IntoResponse {
    let config = state.config.lock();
    let dm = state.dashboard_metrics.as_ref();

    let channel_names = ["telegram", "discord", "slack", "whatsapp", "email", "matrix"];
    let mut channels = Vec::new();

    for name in &channel_names {
        let active = match *name {
            "telegram" => state.telegram.is_some()
                || config.channels_config.telegram.is_some(),
            "discord" => config.channels_config.discord.is_some(),
            "slack" => config.channels_config.slack.is_some(),
            "whatsapp" => state.whatsapp.is_some(),
            "email" => config.channels_config.email.is_some(),
            "matrix" => config.channels_config.matrix.is_some(),
            _ => false,
        };

        let webhook_mode = if *name == "telegram" {
            config
                .channels_config
                .telegram
                .as_ref()
                .map(|t| t.webhook_mode)
        } else {
            None
        };

        let (received, sent, last_activity) = dm
            .and_then(|dm| {
                let m = dm.inner.lock();
                m.channel_messages.get(*name).map(|c| {
                    (
                        c.received,
                        c.sent,
                        c.last_activity.map(|t| {
                            let elapsed = t.elapsed();
                            let dt = Utc::now() - chrono::Duration::from_std(elapsed).unwrap_or_default();
                            dt.to_rfc3339()
                        }),
                    )
                })
            })
            .unwrap_or((0, 0, None));

        if active {
            channels.push(ChannelStatusEntry {
                name: name.to_string(),
                active,
                webhook_mode,
                messages_received: received,
                messages_sent: sent,
                last_activity,
            });
        }
    }

    Json(ChannelsResponse { channels })
}

/// GET /api/memory/stats
async fn handle_memory_stats(State(state): State<AppState>) -> impl IntoResponse {
    let config = state.config.lock();
    let backend = config.memory.backend.clone();
    drop(config);

    let total = state.mem.count().await.unwrap_or(0) as u64;
    let health = state.mem.health_check().await;

    let mut by_category = HashMap::new();
    for cat in &[MemoryCategory::Core, MemoryCategory::Daily, MemoryCategory::Conversation] {
        let cat_entries = state.mem.list(Some(cat), None).await.unwrap_or_default();
        let cat_name = match cat {
            MemoryCategory::Core => "core",
            MemoryCategory::Daily => "daily",
            MemoryCategory::Conversation => "conversation",
            MemoryCategory::Custom(s) => s.as_str(),
        };
        by_category.insert(cat_name.to_string(), cat_entries.len() as u64);
    }

    Json(MemoryStatsResponse {
        backend,
        total_entries: total,
        by_category,
        health,
    })
}

/// GET /api/memory/recent
async fn handle_memory_recent(
    State(state): State<AppState>,
    Query(query): Query<MemoryRecentQuery>,
) -> impl IntoResponse {
    let limit = query.limit.unwrap_or(10).min(50);

    let entries = state
        .mem
        .list(None, None)
        .await
        .unwrap_or_default()
        .into_iter()
        .rev()
        .take(limit)
        .map(|e| {
            let preview = if e.content.len() > 200 {
                format!("{}...", &e.content[..200])
            } else {
                e.content.clone()
            };
            MemoryEntryResponse {
                id: e.id,
                key: e.key,
                category: match &e.category {
                    MemoryCategory::Core => "core".to_string(),
                    MemoryCategory::Daily => "daily".to_string(),
                    MemoryCategory::Conversation => "conversation".to_string(),
                    MemoryCategory::Custom(s) => s.clone(),
                },
                timestamp: e.timestamp,
                content_preview: preview,
            }
        })
        .collect();

    Json(MemoryRecentResponse { entries })
}

// ══════════════════════════════════════════════════════════════════════════════
// ROUTER BUILDER
// ══════════════════════════════════════════════════════════════════════════════

/// Build the `/api/` router with CORS support.
pub fn api_router(cors_origins: &[String]) -> Router<AppState> {
    let origins: Vec<header::HeaderValue> = cors_origins
        .iter()
        .filter_map(|o| o.parse().ok())
        .collect();

    let cors = CorsLayer::new()
        .allow_origin(if origins.is_empty() {
            AllowOrigin::any()
        } else {
            AllowOrigin::list(origins)
        })
        .allow_methods([Method::GET, Method::POST, Method::OPTIONS])
        .allow_headers([header::CONTENT_TYPE, header::AUTHORIZATION]);

    Router::new()
        .route("/status", get(handle_status))
        .route("/metrics", get(handle_api_metrics))
        .route("/logs", get(handle_logs))
        .route("/channels", get(handle_channels))
        .route("/memory/stats", get(handle_memory_stats))
        .route("/memory/recent", get(handle_memory_recent))
        .layer(cors)
}
