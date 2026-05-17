# Skill: Fix Migrations — Consolidate to One File Per Table

## Goal
Each database table should have exactly one migration file: its original `create_*_table` migration. Secondary migrations that add columns or indexes to that table must be merged into the original `Schema::create()` block and then deleted.

---

## Step 1 — Detect Secondary Migrations

Run from `/api`:

```bash
ls database/migrations/ | grep -v "^2019_" | sort
```

Secondary migrations are those whose filename contains any of:
- `augment_<table>_table`
- `add_*_to_<table>`
- `convert_*` / `update_*` / `modify_*` with a table name

Group by the table name extracted from the filename to find tables with more than one file.

---

## Step 2 — Classify Each Secondary Migration

Before merging, classify the secondary migration. Read its full content.

| Type | Criteria | Action |
|---|---|---|
| **Schema-only add** | Uses only `Schema::table()` with `$table->...` column/index calls | **Merge into original** |
| **Data migration** | Uses `DB::table()`, `DB::statement()`, or raw SQL for data transforms — no `Schema::table()` | **Keep separate** — data transforms must run after the table exists and may depend on existing rows |
| **Vendor augmentation** | The original `create_*_table` file does NOT exist in our migrations (table is created by a vendor package, e.g. `personal_access_tokens` by Sanctum) | **Keep separate** — we don't own the create migration |
| **Mixed** | Has both `Schema::table()` column additions AND `DB::` data updates | **Keep separate** — splitting is error-prone; leave as-is and note it |

---

## Step 3 — Merge a Schema-Only Secondary Migration

### 3a. Read both files in full before touching anything.

### 3b. Extract column/index definitions

From the secondary migration's `up()` method, extract each statement inside the `Schema::table()` closure:
- `$table->someColumnType(...)` calls
- `$table->index(...)` / `$table->unique(...)` / `$table->foreign(...)` calls

### 3c. Strip `->after('...')` directives

`->after()` is only meaningful in `ALTER TABLE ADD COLUMN`. Inside a `Schema::create()` block, column order is determined by position in the closure — `->after()` has no effect and should be removed to keep the code clean.

Example:
```php
// Secondary migration (before)
$table->foreignUuid('merged_table_id')
    ->nullable()
    ->after('floor_plan_id')        // ← remove this
    ->constrained('tables')
    ->nullOnDelete();

// After stripping ->after()
$table->foreignUuid('merged_table_id')
    ->nullable()
    ->constrained('tables')
    ->nullOnDelete();
```

### 3d. Insert into the original `Schema::create()` closure

Place the extracted columns **after the last existing column** in the `Schema::create()` closure, and **before** any `$table->index(...)` or `$table->timestamps()` calls. Use judgment to keep logical ordering (foreign keys near related columns, etc.).

Example — original `tables` table migration after merging:
```php
Schema::create('tables', function (Blueprint $table) {
    $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
    $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
    $table->foreignUuid('branch_id')->constrained('branches')->cascadeOnDelete();
    $table->foreignUuid('floor_plan_id')->nullable()->constrained('floor_plans')->nullOnDelete();
    $table->foreignUuid('merged_table_id')->nullable()->constrained('tables')->nullOnDelete();  // ← merged
    $table->string('table_number', 20);
    $table->smallInteger('capacity_min')->default(1);
    $table->smallInteger('capacity_max');
    $table->string('status', 20)->default('free');
    $table->jsonb('position')->default('{}');
    $table->boolean('is_active')->default(true);
    $table->string('section', 100)->nullable();                                                  // ← merged
    $table->string('server_station', 100)->nullable();                                           // ← merged
    $table->timestampTz('seated_at')->nullable();                                                // ← merged
    $table->foreignUuid('seated_by_user_id')->nullable()->constrained('users')->nullOnDelete(); // ← merged
    $table->timestampTz('last_cleared_at')->nullable();                                         // ← merged
    $table->foreignUuid('last_cleared_by_user_id')->nullable()->constrained('users')->nullOnDelete(); // ← merged
    $table->timestamps();

    $table->index(['tenant_id', 'branch_id', 'status']);
    $table->index('merged_table_id');  // ← merged
});
```

### 3e. The `down()` method

The original `down()` already has `Schema::dropIfExists('table_name')` — this correctly drops the entire table including all merged columns. **No changes needed to `down()`.**

### 3f. Preserve any `DB::statement()` calls

If the secondary migration had `DB::statement()` calls (e.g., CHECK constraints added via raw SQL), append them after the `Schema::create()` block in the original migration's `up()` method.

### 3g. Preserve meaningful comments

If the secondary migration had comments explaining WHY a column was added (a constraint, a workaround, etc.), carry them into the original file as inline comments on the column line. Drop boilerplate/obvious comments.

---

## Step 4 — Delete the Merged File

After merging and verifying the original file looks correct, delete the secondary migration file:

```bash
rm database/migrations/<secondary_migration_filename>.php
```

---

## Step 5 — Verify

After all merges:

1. Count migration files and confirm the count decreased by the number of files deleted.
2. Run `php artisan migrate:fresh --seed` (on dev DB only) and confirm it completes without errors.
3. Spot-check the affected tables in the DB to confirm all columns exist.

```bash
php artisan migrate:fresh --seed
```

---

## Quick Reference — How to Find Tables With Multiple Migrations

Run Step 1's detection command (`ls database/migrations/ | grep -v "^2019_" | sort`) and group by table name. The following tables are known to have had secondary migrations at some point — always re-run the detection command rather than relying on this list, as it may be stale:

- `personal_access_tokens` — vendor table (Sanctum); always keep its augment migration separate
- `landing_template_settings` — had `add_supported_locales_to_*` secondary; should be merged
- `tables` — had multiple secondaries: `add_merged_table_id` (merge), `convert_table_positions_to_meter_based` (keep — data migration), `add_floor_designer_metadata` (merge)

> Run the detection command in Step 1 whenever you're about to add a secondary migration — if one exists already for that table, merge instead.

---

## When to Use This Skill vs. Writing a New Migration

| Scenario | Action |
|---|---|
| Adding columns to a table that has never been deployed to staging/production | Merge directly into the create migration |
| Adding columns to a table that IS deployed (data exists in staging/prod) | Write a new `add_*_to_*` migration — merging would lose the ALTER TABLE that running instances need |
| Local-only development DB (fresh migrate every time) | Always merge — no value in secondary files |

> **Rule of thumb for this project:** All migrations here are pre-launch. Treat every DB as "fresh migrate" until we go live. Merge freely.
