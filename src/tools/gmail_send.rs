use super::traits::{Tool, ToolResult};
use crate::runtime::RuntimeAdapter;
use crate::security::SecurityPolicy;
use async_trait::async_trait;
use serde_json::json;
use std::sync::Arc;
use std::time::Duration;

const GMAIL_TIMEOUT_SECS: u64 = 30;
const SAFE_ENV_VARS: &[&str] = &[
    "PATH", "HOME", "TERM", "LANG", "LC_ALL", "LC_CTYPE", "USER", "SHELL", "TMPDIR",
];

pub struct GmailSendTool {
    security: Arc<SecurityPolicy>,
    runtime: Arc<dyn RuntimeAdapter>,
}

impl GmailSendTool {
    pub fn new(security: Arc<SecurityPolicy>, runtime: Arc<dyn RuntimeAdapter>) -> Self {
        Self { security, runtime }
    }
}

#[async_trait]
impl Tool for GmailSendTool {
    fn name(&self) -> &str {
        "gmail_send"
    }

    fn description(&self) -> &str {
        "Envoyer un email via Gmail. Necessite destinataire, sujet et contenu."
    }

    fn parameters_schema(&self) -> serde_json::Value {
        json!({
            "type": "object",
            "properties": {
                "to": {
                    "type": "string",
                    "description": "Adresse email du destinataire"
                },
                "subject": {
                    "type": "string",
                    "description": "Sujet de l'email"
                },
                "body": {
                    "type": "string",
                    "description": "Contenu du message"
                }
            },
            "required": ["to", "subject", "body"]
        })
    }

    async fn execute(&self, args: serde_json::Value) -> anyhow::Result<ToolResult> {
        let to = args
            .get("to")
            .and_then(|v| v.as_str())
            .ok_or_else(|| anyhow::anyhow!("Missing 'to' parameter"))?;
        let subject = args
            .get("subject")
            .and_then(|v| v.as_str())
            .ok_or_else(|| anyhow::anyhow!("Missing 'subject' parameter"))?;
        let body = args
            .get("body")
            .and_then(|v| v.as_str())
            .ok_or_else(|| anyhow::anyhow!("Missing 'body' parameter"))?;

        if self.security.is_rate_limited() {
            return Ok(ToolResult {
                success: false,
                output: String::new(),
                error: Some("Rate limit exceeded".into()),
            });
        }

        if !self.security.record_action() {
            return Ok(ToolResult {
                success: false,
                output: String::new(),
                error: Some("Rate limit exceeded: action budget exhausted".into()),
            });
        }

        let script = self.security.workspace_dir.join("scripts/gmail-send.sh");
        // Escape single quotes in arguments
        let to_safe = to.replace('\'', "'\\''");
        let subject_safe = subject.replace('\'', "'\\''");
        let body_safe = body.replace('\'', "'\\''");
        let command = format!(
            "sh {} '{}' '{}' '{}'",
            script.display(),
            to_safe,
            subject_safe,
            body_safe
        );

        let mut cmd = match self
            .runtime
            .build_shell_command(&command, &self.security.workspace_dir)
        {
            Ok(cmd) => cmd,
            Err(e) => {
                return Ok(ToolResult {
                    success: false,
                    output: String::new(),
                    error: Some(format!("Failed to build command: {e}")),
                });
            }
        };
        cmd.env_clear();
        for var in SAFE_ENV_VARS {
            if let Ok(val) = std::env::var(var) {
                cmd.env(var, val);
            }
        }

        let result =
            tokio::time::timeout(Duration::from_secs(GMAIL_TIMEOUT_SECS), cmd.output()).await;

        match result {
            Ok(Ok(output)) => {
                let stdout = String::from_utf8_lossy(&output.stdout).to_string();
                let stderr = String::from_utf8_lossy(&output.stderr).to_string();
                let combined = if stderr.is_empty() {
                    stdout.clone()
                } else {
                    format!("{stdout}\n{stderr}")
                };
                Ok(ToolResult {
                    success: output.status.success(),
                    output: combined,
                    error: None,
                })
            }
            Ok(Err(e)) => Ok(ToolResult {
                success: false,
                output: String::new(),
                error: Some(format!("Failed to execute: {e}")),
            }),
            Err(_) => Ok(ToolResult {
                success: false,
                output: String::new(),
                error: Some(format!("Timeout after {GMAIL_TIMEOUT_SECS}s")),
            }),
        }
    }
}
