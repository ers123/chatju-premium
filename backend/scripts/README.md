# Backend Scripts

## Retention Cleanup

Run a dry-run first:

```bash
npm run retention:cleanup
```

Apply cleanup explicitly:

```bash
DRY_RUN=false npm run retention:cleanup
```

Config:

- `READING_RETENTION_DAYS` default `365`
- `PAYMENT_RETENTION_DAYS` default `1825`
- `DRY_RUN` defaults to true unless exactly `false`

Behavior:

- Deletes readings older than `READING_RETENTION_DAYS`.
- Deletes promo usage rows older than `READING_RETENTION_DAYS`.
- Minimizes payment metadata older than `PAYMENT_RETENTION_DAYS` while keeping transaction records needed for commerce, tax, refund, dispute, and audit purposes.

Schedule this from a trusted backend environment, for example monthly via cron, GitHub Actions with protected secrets, AWS EventBridge, or a manual admin runbook.
