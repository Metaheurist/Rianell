# AI Data Processing Policy

## Overview
This document describes how anonymized health data is collected, processed, and used to improve AI predictions in the Health App.

## Data Collection

### When Data is Collected
- Anonymized data is only collected when the user explicitly enables "Optimised AI" in the app settings
- Data collection occurs automatically when health log entries are saved
- Data is synced to the server even if the user is not logged into their personal cloud account

### What Data is Collected
Only anonymized health metrics are collected. The following data is included:
- Health metrics: BPM, weight, fatigue, stiffness, back pain, sleep, joint pain, mobility, daily function, swelling, mood, irritability, weather sensitivity, steps, hydration, flare status
- Arrays: stressors, symptoms, food (with calories/protein), exercise
- Text fields: pain location, energy/clarity status

### What Data is NOT Collected
The following personally identifiable information is explicitly excluded:
- User name or any personal identifiers
- Notes (which may contain personal information)
- User account information
- Email addresses
- Any other personally identifiable data

## Data Anonymization

### Process
1. All health log entries are processed through an anonymization function
2. Personal identifiers are stripped before data leaves the device
3. Data is grouped by medical condition (not by user)
4. Each anonymized entry is stored separately in the database

### Grouping
- Data is grouped by the medical condition selected by the user
- Users with the same condition contribute to the same data pool
- No user-specific tracking or identification is possible

## Data Usage

### Purpose
Anonymized data is used exclusively to:
- Improve AI prediction accuracy for users with the same medical condition
- Train machine learning models for better health trend analysis
- Provide more accurate predictions based on aggregated patterns

### Access
- Anonymized data is publicly readable (it contains no personal information)
- Data can be used by any user with the same medical condition
- No authentication is required to read anonymized data

## Data Requirements

### Minimum Data Threshold
- A minimum of 90 days of data is required before Optimised AI becomes fully available
- Until this threshold is met, the system shows "Helping the model" status
- Users can still contribute data during this period

### Data Availability
- Conditions with 90+ days of data are listed in the condition selector
- Users can select from existing conditions or add new ones
- New conditions start collecting data immediately

## User Control

### Opt-In/Opt-Out
- Optimised AI is **opt-in only** - disabled by default
- Users can enable or disable it at any time in settings
- Disabling stops data contribution but does not delete previously contributed data

### Transparency
- Users are informed about data collection through:
  - Settings modal with clear explanation
  - AI Data Processing Policy displayed in condition selector
  - Status messages showing data availability

## Security

### Data Storage
- Data is stored in Supabase with Row Level Security (RLS) enabled
- Anonymous read access is allowed (data is already anonymized)
- Anonymous insert access is allowed (for data contribution)

### Data Integrity
- Each anonymized entry is timestamped
- Data cannot be updated after insertion (append-only)
- No user tracking or correlation is possible

## Compliance

### Privacy
- This system complies with privacy best practices by:
  - Collecting only anonymized data
  - Requiring explicit opt-in
  - Providing clear information about data usage
  - Allowing users to opt-out at any time

### Data Rights
- Users can stop contributing data by disabling Optimised AI
- Previously contributed anonymized data cannot be individually deleted (it's anonymized and pooled)
- Users can change their medical condition at any time

## Technical Implementation

### Database Schema
- Table: `anonymized_data`
- Columns: `id`, `medical_condition`, `anonymized_log` (JSONB), `created_at`, `updated_at`
- Indexes on `medical_condition` and date fields for efficient queries

### Functions
- `anonymizeHealthLog()`: Strips personal identifiers from log entries
- `syncAnonymizedData()`: Syncs anonymized data to server
- `getAnonymizedTrainingData()`: Retrieves anonymized data for AI training
- `checkConditionDataAvailability()`: Checks if condition has 90+ days of data

## Contact

For questions or concerns about data processing, please refer to the app settings or contact support.

---

**Last Updated**: January 2026
**Version**: 1.0
