# S3 Storage Zones Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Introduce a structured `public/private` S3 folder convention per tenant, centralise all path construction in a `StoragePath` helper, standardise DB storage to always save paths (not URLs), and document the pattern so every future upload follows it automatically.

**Architecture:** All S3 paths follow `tenants/{tenant_id}/public/{type}/...` or `tenants/{tenant_id}/private/{type}/...`. The bucket policy grants `s3:GetObject` on `tenants/*/public/*` only. Services call `StoragePath` to build paths; Resources resolve path → URL at response time using `Storage::url()` (public) or `Storage::temporaryUrl()` (private). The DB always stores the path, never a full URL.

**Tech Stack:** Laravel 12, AWS S3 (`league/flysystem-aws-s3-v3`), Artisan console command for data migration.

---

## Current State Audit

| Upload type | Current S3 path | DB stores | Zone |
|---|---|---|---|
| Menu item photo | `tenants/{tid}/menu-items/{id}.{ext}` | full URL | public |
| Menu category photo | `tenants/{tid}/menu-categories/{id}.{ext}` | full URL | public |
| Staff profile photo | `tenants/{tid}/profile-photos/{uid}.{ext}` | path | public |
| Staff document | `tenants/{tid}/staff/{uid}/{filename}` | path (in JSONB) | private |
| Analytics export | `exports/{tid}/{jobId}.{format}` | not stored (temp URL) | private |
| Scheduled report | `exports/{tid}/{jobId}.{format}` | not stored (temp URL) | private |
| GDPR export | `gdpr-exports/{tid}/{cid}/{jobId}.json` | not stored (temp URL) | private |

**Problems:**
- Bucket policy must enumerate every subfolder individually — breaks silently when a new upload type is added
- Menu items/categories store full URLs in `photo_url` column — URL format is baked into data; environment changes (CDN, region) break all existing records
- No single source of truth for path conventions — every service invents its own pattern
- Staff documents and profile photos are not covered by any bucket policy rule — served broken

---

## Target State

```
tenants/{tenant_id}/public/menu-items/{id}.{ext}
tenants/{tenant_id}/public/menu-categories/{id}.{ext}
tenants/{tenant_id}/public/profile-photos/{user_id}.{ext}

tenants/{tenant_id}/private/staff-documents/{staff_id}/{filename}
tenants/{tenant_id}/private/exports/{job_id}.{format}
tenants/{tenant_id}/private/gdpr-exports/{customer_id}/{job_id}.json
```

Bucket policy becomes two ARNs forever — new upload types are automatically covered:
```json
"Resource": [
    "arn:aws:s3:::cheflogik/tenants/*/public/*"
]
```
(Private paths have no bucket policy rule — access via pre-signed URLs only.)

---

## File Map

| Action | File |
|---|---|
| Create | `api/app/Support/StoragePath.php` |
| Modify | `api/app/Services/Menu/MenuItemService.php` |
| Modify | `api/app/Services/Menu/MenuCategoryService.php` |
| Modify | `api/app/Services/Profile/ProfileService.php` |
| Modify | `api/app/Services/Staff/StaffService.php` |
| Modify | `api/app/Jobs/Analytics/GenerateReportExportJob.php` |
| Modify | `api/app/Jobs/Analytics/SendScheduledReportJob.php` |
| Modify | `api/app/Jobs/Customers/GdprDataExportJob.php` |
| Modify | `api/app/Http/Resources/Menu/MenuItemResource.php` |
| Modify | `api/app/Http/Resources/Menu/MenuCategoryResource.php` |
| Modify | `api/app/Http/Resources/Profile/ProfileResource.php` |
| Modify | `api/app/Http/Resources/Staff/StaffResource.php` |
| Create | `api/app/Console/Commands/MigrateS3Paths.php` |
| Modify | `api/app/Console/Commands/Kernel.php` (register command) |
| Modify | `decisions.md` (update Decision 12) |
| Modify | `CLAUDE.md` (add storage rule to Section 5) |
| Modify | `docs/02-tech-stack.md` (add S3 conventions section) |

---

## Task 1: Create `StoragePath` helper

**Files:**
- Create: `api/app/Support/StoragePath.php`

- [ ] **Step 1: Create the helper class**

```php
<?php

declare(strict_types=1);

namespace App\Support;

/**
 * Single source of truth for all S3 path construction.
 *
 * Convention:
 *   public  → tenants/{tenant_id}/public/{type}/...   (bucket policy grants s3:GetObject)
 *   private → tenants/{tenant_id}/private/{type}/...  (no public policy; serve via temporaryUrl)
 *
 * Services call these methods to get paths.
 * Resources call StoragePath::publicUrl() or StoragePath::privateUrl() to resolve.
 * The DB always stores the path — never a full URL.
 */
class StoragePath
{
    // ── Public paths ────────────────────────────────────────────────────────

    public static function menuItemPhoto(string $tenantId, string $itemId, string $ext): string
    {
        return "tenants/{$tenantId}/public/menu-items/{$itemId}.{$ext}";
    }

    public static function menuCategoryPhoto(string $tenantId, string $categoryId, string $ext): string
    {
        return "tenants/{$tenantId}/public/menu-categories/{$categoryId}.{$ext}";
    }

    public static function staffProfilePhoto(string $tenantId, string $userId, string $ext): string
    {
        return "tenants/{$tenantId}/public/profile-photos/{$userId}.{$ext}";
    }

    // ── Private paths ────────────────────────────────────────────────────────

    public static function staffDocument(string $tenantId, string $staffId, string $filename): string
    {
        return "tenants/{$tenantId}/private/staff-documents/{$staffId}/{$filename}";
    }

    public static function analyticsExport(string $tenantId, string $jobId, string $format): string
    {
        return "tenants/{$tenantId}/private/exports/{$jobId}.{$format}";
    }

    public static function gdprExport(string $tenantId, string $customerId, string $jobId): string
    {
        return "tenants/{$tenantId}/private/gdpr-exports/{$customerId}/{$jobId}.json";
    }

    // ── URL resolution ───────────────────────────────────────────────────────

    /** Resolve a public path to a permanent S3 URL. */
    public static function publicUrl(string $path): string
    {
        return \Illuminate\Support\Facades\Storage::disk('s3')->url($path);
    }

    /**
     * Resolve a private path to a pre-signed URL.
     * Default TTL: 60 minutes. Override $ttlMinutes for longer-lived links (e.g. GDPR exports).
     */
    public static function privateUrl(string $path, int $ttlMinutes = 60): string
    {
        return \Illuminate\Support\Facades\Storage::disk('s3')
            ->temporaryUrl($path, now()->addMinutes($ttlMinutes));
    }

    /** Returns true if the path lives under the public zone. */
    public static function isPublic(string $path): bool
    {
        return str_contains($path, '/public/');
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add api/app/Support/StoragePath.php
git commit -m "feat: add StoragePath helper — single source of truth for S3 path construction"
```

---

## Task 2: Update `MenuItemService` and `MenuItemResource`

**Files:**
- Modify: `api/app/Services/Menu/MenuItemService.php`
- Modify: `api/app/Http/Resources/Menu/MenuItemResource.php`

The service currently stores the full URL in `photo_url`. Change it to store the path and resolve the URL in the Resource.

- [ ] **Step 1: Update `MenuItemService::uploadPhoto()`**

Open `api/app/Services/Menu/MenuItemService.php`. Replace the `uploadPhoto` method body:

```php
use App\Support\StoragePath;
```

Add the use statement at the top with the other use statements, then update `uploadPhoto`:

```php
public function uploadPhoto(MenuItem $item, UploadedFile $file): MenuItem
{
    $ext  = $file->getClientOriginalExtension();
    $path = StoragePath::menuItemPhoto((string) $item->tenant_id, (string) $item->id, $ext);

    if ($item->photo_url) {
        Storage::disk('s3')->delete($item->photo_url);
    }

    Storage::disk('s3')->put($path, $file->getContent());

    $item->update(['photo_url' => $path]);

    return $item->fresh();
}
```

- [ ] **Step 2: Update `MenuItemResource` to resolve the URL**

Open `api/app/Http/Resources/Menu/MenuItemResource.php`. Add the use statement:

```php
use App\Support\StoragePath;
```

Find the `photo_url` line in `toArray()` and update it:

```php
'photo_url' => $this->photo_url
    ? StoragePath::publicUrl($this->photo_url)
    : null,
```

- [ ] **Step 3: Commit**

```bash
git add api/app/Services/Menu/MenuItemService.php api/app/Http/Resources/Menu/MenuItemResource.php
git commit -m "feat: menu item photos use StoragePath; resource resolves path to URL"
```

---

## Task 3: Update `MenuCategoryService` and `MenuCategoryResource`

**Files:**
- Modify: `api/app/Services/Menu/MenuCategoryService.php`
- Modify: `api/app/Http/Resources/Menu/MenuCategoryResource.php`

- [ ] **Step 1: Update `MenuCategoryService::uploadPhoto()`**

Open `api/app/Services/Menu/MenuCategoryService.php`. Add use statement:

```php
use App\Support\StoragePath;
```

Update `uploadPhoto`:

```php
public function uploadPhoto(MenuCategory $category, UploadedFile $file): MenuCategory
{
    $ext  = $file->getClientOriginalExtension();
    $path = StoragePath::menuCategoryPhoto((string) $category->tenant_id, (string) $category->id, $ext);

    if ($category->photo_url) {
        Storage::disk('s3')->delete($category->photo_url);
    }

    Storage::disk('s3')->put($path, $file->getContent());

    $category->update(['photo_url' => $path]);

    return $category->fresh();
}
```

- [ ] **Step 2: Update `MenuCategoryResource` to resolve the URL**

Open `api/app/Http/Resources/Menu/MenuCategoryResource.php`. Add use statement:

```php
use App\Support\StoragePath;
```

Update `photo_url` in `toArray()`:

```php
'photo_url' => $this->photo_url
    ? StoragePath::publicUrl($this->photo_url)
    : null,
```

- [ ] **Step 3: Commit**

```bash
git add api/app/Services/Menu/MenuCategoryService.php api/app/Http/Resources/Menu/MenuCategoryResource.php
git commit -m "feat: menu category photos use StoragePath; resource resolves path to URL"
```

---

## Task 4: Update `ProfileService` and `ProfileResource`

**Files:**
- Modify: `api/app/Services/Profile/ProfileService.php`
- Modify: `api/app/Http/Resources/Profile/ProfileResource.php`

- [ ] **Step 1: Update `ProfileService::uploadPhoto()`**

Open `api/app/Services/Profile/ProfileService.php`. Add use statement:

```php
use App\Support\StoragePath;
```

Update `uploadPhoto`:

```php
public function uploadPhoto(User $user, UploadedFile $file): User
{
    $ext  = $file->getClientOriginalExtension();
    $path = StoragePath::staffProfilePhoto((string) $user->tenant_id, (string) $user->id, $ext);

    if ($user->profile_photo) {
        Storage::disk('s3')->delete($user->profile_photo);
    }

    Storage::disk('s3')->put($path, $file->getContent());

    $user->update(['profile_photo' => $path]);

    return $user->fresh();
}
```

- [ ] **Step 2: Update `ProfileResource` to use `StoragePath`**

Open `api/app/Http/Resources/Profile/ProfileResource.php`. Replace the existing `Storage` import with `StoragePath`:

Remove:
```php
use Illuminate\Support\Facades\Storage;
```

Add:
```php
use App\Support\StoragePath;
```

Update `profile_photo` in `toArray()`:

```php
'profile_photo' => $this->profile_photo
    ? StoragePath::publicUrl($this->profile_photo)
    : null,
```

- [ ] **Step 3: Commit**

```bash
git add api/app/Services/Profile/ProfileService.php api/app/Http/Resources/Profile/ProfileResource.php
git commit -m "feat: profile photos use StoragePath; resource resolves path to URL"
```

---

## Task 5: Update `StaffService` (documents) and `StaffResource`

**Files:**
- Modify: `api/app/Services/Staff/StaffService.php`
- Modify: `api/app/Http/Resources/Staff/StaffResource.php`

Staff documents are private — they must be served via pre-signed URLs. The `documents` JSONB array on the `users` table stores `file_path` per document.

- [ ] **Step 1: Update `StaffService::uploadDocument()`**

Open `api/app/Services/Staff/StaffService.php`. Add use statement:

```php
use App\Support\StoragePath;
```

Locate the `uploadDocument` method (around line 153) and update the path construction:

```php
public function uploadDocument(User $staff, UploadedFile $file, string $type, ?string $expiryDate): string
{
    $path = StoragePath::staffDocument(
        (string) $staff->tenant_id,
        (string) $staff->id,
        $file->getClientOriginalName(),
    );

    Storage::disk('s3')->put($path, $file->getContent());

    $documents   = $staff->documents ?? [];
    $documents[] = [
        'type'        => $type,
        'expiry_date' => $expiryDate,
        'file_path'   => $path,
        'uploaded_at' => now()->toISOString(),
    ];

    $staff->update(['documents' => $documents]);

    return $path;
}
```

- [ ] **Step 2: Update `StaffResource` to resolve document URLs and profile photo**

Open `api/app/Http/Resources/Staff/StaffResource.php`. Add use statement:

```php
use App\Support\StoragePath;
```

Find `profile_photo` in `toArray()` and update it:

```php
'profile_photo' => $this->profile_photo
    ? StoragePath::publicUrl($this->profile_photo)
    : null,
```

Find the `documents` field (it should be returned as an array). Update each document entry to include a pre-signed `download_url`:

```php
'documents' => collect($this->documents ?? [])->map(fn (array $doc) => [
    ...$doc,
    'download_url' => isset($doc['file_path'])
        ? StoragePath::privateUrl($doc['file_path'], ttlMinutes: 60)
        : null,
])->all(),
```

- [ ] **Step 3: Commit**

```bash
git add api/app/Services/Staff/StaffService.php api/app/Http/Resources/Staff/StaffResource.php
git commit -m "feat: staff documents use StoragePath private zone; resource adds pre-signed download_url"
```

---

## Task 6: Update analytics and GDPR export jobs

**Files:**
- Modify: `api/app/Jobs/Analytics/GenerateReportExportJob.php`
- Modify: `api/app/Jobs/Analytics/SendScheduledReportJob.php`
- Modify: `api/app/Jobs/Customers/GdprDataExportJob.php`

- [ ] **Step 1: Update `GenerateReportExportJob`**

Open `api/app/Jobs/Analytics/GenerateReportExportJob.php`. Add use statement:

```php
use App\Support\StoragePath;
```

Locate the section that constructs `$path` and generates the URL. Replace:

```php
$path    = "exports/{$this->tenantId}/{$this->jobId}.{$this->format}";
// ...
Storage::disk('s3')->put($path, $content, 'private');
$url = Storage::disk('s3')->temporaryUrl($path, now()->addHours(24));
```

With:

```php
$path = StoragePath::analyticsExport((string) $this->tenantId, (string) $this->jobId, $this->format);
// ...
Storage::disk('s3')->put($path, $content);
$url = StoragePath::privateUrl($path, ttlMinutes: 1440); // 24 h
```

- [ ] **Step 2: Update `SendScheduledReportJob`**

Open `api/app/Jobs/Analytics/SendScheduledReportJob.php`. Add use statement:

```php
use App\Support\StoragePath;
```

Replace:

```php
$path     = "exports/{$this->tenantId}/{$jobId}.{$this->format}";
// ...
Storage::disk('s3')->put($path, $content, 'private');
$downloadUrl = Storage::disk('s3')->temporaryUrl($path, now()->addHours(24));
```

With:

```php
$path = StoragePath::analyticsExport((string) $this->tenantId, (string) $jobId, $this->format);
// ...
Storage::disk('s3')->put($path, $content);
$downloadUrl = StoragePath::privateUrl($path, ttlMinutes: 1440); // 24 h
```

- [ ] **Step 3: Update `GdprDataExportJob`**

Open `api/app/Jobs/Customers/GdprDataExportJob.php`. Add use statement:

```php
use App\Support\StoragePath;
```

Replace:

```php
$path = "gdpr-exports/{$this->tenantId}/{$this->customerId}/{$this->jobId}.json";
// ...
Storage::disk('s3')->put($path, json_encode($data, JSON_PRETTY_PRINT), 'private');
$url = Storage::disk('s3')->temporaryUrl($path, now()->addHours(72));
```

With:

```php
$path = StoragePath::gdprExport((string) $this->tenantId, (string) $this->customerId, (string) $this->jobId);
// ...
Storage::disk('s3')->put($path, json_encode($data, JSON_PRETTY_PRINT));
$url = StoragePath::privateUrl($path, ttlMinutes: 4320); // 72 h
```

- [ ] **Step 4: Commit**

```bash
git add api/app/Jobs/Analytics/GenerateReportExportJob.php \
        api/app/Jobs/Analytics/SendScheduledReportJob.php \
        api/app/Jobs/Customers/GdprDataExportJob.php
git commit -m "feat: export jobs use StoragePath private zone"
```

---

## Task 7: Data migration — move existing S3 objects and update DB records

This migrates existing uploads at old paths to the new `public/private` zone paths, and converts any full URLs stored in `photo_url` columns to paths.

> ⚠️ **Before running this command in staging/production:** take an RDS snapshot. The command is idempotent (skips records already on new-style paths) but belt-and-suspenders is wise.

> ⚠️ **Migration files:** Per project rules, confirm with the user before creating any new migration file. This task uses an Artisan console command (not a DB migration) because the S3 move and DB update are coupled.

**Files:**
- Create: `api/app/Console/Commands/MigrateS3Paths.php`

- [ ] **Step 1: Create the Artisan command**

```php
<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\MenuItem;
use App\Models\MenuCategory;
use App\Models\User;
use App\Support\StoragePath;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class MigrateS3Paths extends Command
{
    protected $signature   = 'storage:migrate-paths {--dry-run : Print what would change without making changes}';
    protected $description = 'Move existing S3 objects to the public/private zone layout and update DB records.';

    public function handle(): int
    {
        $dry = (bool) $this->option('dry-run');

        if ($dry) {
            $this->info('[DRY RUN] No changes will be made.');
        }

        $this->migrateMenuItemPhotos($dry);
        $this->migrateMenuCategoryPhotos($dry);
        $this->migrateProfilePhotos($dry);
        $this->migrateStaffDocuments($dry);

        $this->info('Done.');
        return self::SUCCESS;
    }

    private function migrateMenuItemPhotos(bool $dry): void
    {
        $this->info('Migrating menu item photos…');

        // photo_url may be a full S3 URL or already a new-style path
        MenuItem::whereNotNull('photo_url')->chunkById(100, function ($items) use ($dry) {
            foreach ($items as $item) {
                $current = $item->photo_url;

                // Already a path on the new structure — skip
                if (str_contains($current, '/public/menu-items/')) {
                    continue;
                }

                // Derive the new path regardless of whether current is a URL or old path
                $ext     = pathinfo($current, PATHINFO_EXTENSION);
                $newPath = StoragePath::menuItemPhoto((string) $item->tenant_id, (string) $item->id, $ext);

                // Resolve old path: strip URL prefix if full URL stored
                $oldPath = $this->extractPath($current);

                $this->line("  MenuItem {$item->id}: {$oldPath} → {$newPath}");

                if (! $dry) {
                    if (Storage::disk('s3')->exists($oldPath)) {
                        Storage::disk('s3')->copy($oldPath, $newPath);
                        Storage::disk('s3')->delete($oldPath);
                    }
                    $item->update(['photo_url' => $newPath]);
                }
            }
        });
    }

    private function migrateMenuCategoryPhotos(bool $dry): void
    {
        $this->info('Migrating menu category photos…');

        MenuCategory::whereNotNull('photo_url')->chunkById(100, function ($categories) use ($dry) {
            foreach ($categories as $category) {
                $current = $category->photo_url;

                if (str_contains($current, '/public/menu-categories/')) {
                    continue;
                }

                $ext     = pathinfo($current, PATHINFO_EXTENSION);
                $newPath = StoragePath::menuCategoryPhoto((string) $category->tenant_id, (string) $category->id, $ext);
                $oldPath = $this->extractPath($current);

                $this->line("  MenuCategory {$category->id}: {$oldPath} → {$newPath}");

                if (! $dry) {
                    if (Storage::disk('s3')->exists($oldPath)) {
                        Storage::disk('s3')->copy($oldPath, $newPath);
                        Storage::disk('s3')->delete($oldPath);
                    }
                    $category->update(['photo_url' => $newPath]);
                }
            }
        });
    }

    private function migrateProfilePhotos(bool $dry): void
    {
        $this->info('Migrating staff profile photos…');

        User::whereNotNull('profile_photo')->chunkById(100, function ($users) use ($dry) {
            foreach ($users as $user) {
                $current = $user->profile_photo;

                if (str_contains($current, '/public/profile-photos/')) {
                    continue;
                }

                $ext     = pathinfo($current, PATHINFO_EXTENSION);
                $newPath = StoragePath::staffProfilePhoto((string) $user->tenant_id, (string) $user->id, $ext);
                $oldPath = $this->extractPath($current);

                $this->line("  User {$user->id}: {$oldPath} → {$newPath}");

                if (! $dry) {
                    if (Storage::disk('s3')->exists($oldPath)) {
                        Storage::disk('s3')->copy($oldPath, $newPath);
                        Storage::disk('s3')->delete($oldPath);
                    }
                    $user->update(['profile_photo' => $newPath]);
                }
            }
        });
    }

    private function migrateStaffDocuments(bool $dry): void
    {
        $this->info('Migrating staff documents…');

        User::whereNotNull('documents')->chunkById(100, function ($users) use ($dry) {
            foreach ($users as $user) {
                $documents = $user->documents ?? [];
                $changed   = false;

                foreach ($documents as &$doc) {
                    $oldPath = $doc['file_path'] ?? null;
                    if (! $oldPath || str_contains($oldPath, '/private/staff-documents/')) {
                        continue;
                    }

                    $filename = basename($oldPath);
                    $newPath  = StoragePath::staffDocument((string) $user->tenant_id, (string) $user->id, $filename);

                    $this->line("  User {$user->id} doc: {$oldPath} → {$newPath}");

                    if (! $dry) {
                        if (Storage::disk('s3')->exists($oldPath)) {
                            Storage::disk('s3')->copy($oldPath, $newPath);
                            Storage::disk('s3')->delete($oldPath);
                        }
                        $doc['file_path'] = $newPath;
                        $changed = true;
                    }
                }
                unset($doc);

                if ($changed) {
                    $user->update(['documents' => $documents]);
                }
            }
        });
    }

    /** Extract the S3 object key from either a full URL or a bare path. */
    private function extractPath(string $urlOrPath): string
    {
        if (str_starts_with($urlOrPath, 'http')) {
            $parsed = parse_url($urlOrPath);
            // path is like /bucket/tenants/... for path-style, or /tenants/... for virtual-hosted
            $path = ltrim($parsed['path'] ?? '', '/');
            // If the first segment is the bucket name, strip it
            $bucket = config('filesystems.disks.s3.bucket', '');
            if ($bucket && str_starts_with($path, $bucket . '/')) {
                $path = substr($path, strlen($bucket) + 1);
            }
            return $path;
        }

        return $urlOrPath;
    }
}
```

- [ ] **Step 2: Register the command in `Kernel.php`**

Open `api/app/Console/Kernel.php` (or `app/Console/Commands/` is auto-discovered in Laravel 12 — verify). In Laravel 12 commands in `app/Console/Commands/` are auto-discovered, so no registration is needed. Verify:

```bash
cd /api && php artisan list | grep storage:migrate
```

Expected output:
```
storage:migrate-paths  Move existing S3 objects to the public/private zone layout and update DB records.
```

- [ ] **Step 3: Run dry-run in local environment first**

```bash
cd /api && php artisan storage:migrate-paths --dry-run
```

Review the output — every listed path should look correct before proceeding.

- [ ] **Step 4: Run the actual migration locally**

```bash
cd /api && php artisan storage:migrate-paths
```

- [ ] **Step 5: Commit**

```bash
git add api/app/Console/Commands/MigrateS3Paths.php
git commit -m "feat: add storage:migrate-paths command to move existing S3 objects to public/private zones"
```

---

## Task 8: Update AWS S3 bucket policy

This is a manual step in the AWS Console (or via Terraform if infra is managed that way).

- [ ] **Step 1: Open the S3 bucket policy for `cheflogik`**

In the AWS Console → S3 → `cheflogik` → Permissions → Bucket policy.

- [ ] **Step 2: Replace the existing PublicReadPhotos statement**

Replace the current `PublicReadPhotos` statement (which lists individual resource ARNs) with:

```json
{
    "Sid": "PublicReadTenantPublicZone",
    "Effect": "Allow",
    "Principal": "*",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::cheflogik/tenants/*/public/*"
}
```

- [ ] **Step 3: Save and verify**

After saving, open one of the newly migrated photo URLs in the browser to confirm the image loads.

---

## Task 9: Update documentation

**Files:**
- Modify: `decisions.md`
- Modify: `CLAUDE.md`
- Modify: `docs/02-tech-stack.md`

- [ ] **Step 1: Update Decision 12 in `decisions.md`**

Find `## Decision 12 — File Storage` and replace it with:

```markdown
## Decision 12 — File Storage

**Date decided:** 2026-04-07
**Updated:** 2026-05-25
**Decision:** AWS S3 (`league/flysystem-aws-s3-v3`)
**Used for:** All tenant file uploads and exports.

### Folder convention (mandatory for all uploads)

```
tenants/{tenant_id}/public/{type}/...    ← publicly accessible via bucket policy
tenants/{tenant_id}/private/{type}/...  ← no public access; served via pre-signed URLs
```

**Current public types:** `menu-items`, `menu-categories`, `profile-photos`
**Current private types:** `staff-documents`, `exports`, `gdpr-exports`

### Rules

1. **Always use `App\Support\StoragePath`** to build paths — never hardcode path strings in services or jobs.
2. **DB always stores the path, never the full URL.** Resources resolve path → URL at response time using `StoragePath::publicUrl()` or `StoragePath::privateUrl()`.
3. **Public files** are served via the permanent S3 URL (`StoragePath::publicUrl()`). The bucket policy grants `s3:GetObject` on `tenants/*/public/*` — adding a new public type requires no policy change.
4. **Private files** are served via pre-signed URLs (`StoragePath::privateUrl($path, $ttlMinutes)`). Default TTL: 60 min. Use longer TTLs only for async exports (24 h) and GDPR exports (72 h).
5. **Adding a new upload type:** add a static method to `StoragePath`, choose the zone (public/private), use it in the service, resolve in the resource. No bucket policy change needed for private; no change needed for public either (wildcard covers it).
```

- [ ] **Step 2: Add S3 rule to Section 5 of `CLAUDE.md`**

In `CLAUDE.md`, find the `## 5. Critical Rules` section and add after the last existing rule:

```markdown
### S3 file uploads — always use `StoragePath`
1. **Never hardcode an S3 path string** in a service, job, or controller. Always use `App\Support\StoragePath` static methods.
2. **DB stores paths, not URLs.** Call `StoragePath::publicUrl($path)` or `StoragePath::privateUrl($path, $ttlMinutes)` inside the API Resource when building the response.
3. **Public zone** (`tenants/{tid}/public/...`): images served directly in browser. Covered by bucket policy wildcard — no AWS change needed for new types.
4. **Private zone** (`tenants/{tid}/private/...`): documents, exports, sensitive files. Serve only via `StoragePath::privateUrl()`. Never put private files in the public zone.
5. **Adding a new upload type:** add a method to `StoragePath`, pick a zone, use in service, resolve in resource. See `decisions.md` Decision 12 for the full pattern.
```

- [ ] **Step 3: Add S3 conventions section to `docs/02-tech-stack.md`**

Find the file storage section (search for "S3" or "flysystem") and add or update:

```markdown
### S3 File Storage Conventions

All S3 uploads follow a `public/private` zone layout per tenant:

```
tenants/{tenant_id}/public/{type}/...    ← bucket policy allows public GET
tenants/{tenant_id}/private/{type}/...  ← no public access; pre-signed URLs only
```

**The pattern for every new upload type:**

1. Add a static path method to `App\Support\StoragePath`
2. In the service: call `StoragePath::{methodName}()` for the path, then `Storage::disk('s3')->put($path, $content)`
3. In the API Resource: call `StoragePath::publicUrl($path)` or `StoragePath::privateUrl($path, $ttlMinutes)`
4. Store only the path in the DB column — never the full URL

See `decisions.md` Decision 12 for rationale and the full list of current types.
```

- [ ] **Step 4: Commit**

```bash
git add decisions.md CLAUDE.md docs/02-tech-stack.md
git commit -m "docs: document S3 public/private zone convention in decisions, CLAUDE.md, and tech-stack"
```

---

## Self-Review

**Spec coverage:**
- ✅ `StoragePath` helper — Task 1
- ✅ Menu item photos → new paths, resource resolves URL — Task 2
- ✅ Menu category photos → new paths, resource resolves URL — Task 3
- ✅ Profile photos → new paths, resource resolves URL — Task 4
- ✅ Staff documents → private zone, resource adds pre-signed `download_url` — Task 5
- ✅ Export jobs → private zone via `StoragePath` — Task 6
- ✅ Data migration for existing objects — Task 7
- ✅ Bucket policy updated to single wildcard ARN — Task 8
- ✅ decisions.md, CLAUDE.md, docs/02-tech-stack.md documented — Task 9

**Placeholder scan:** None found.

**Type consistency:** `StoragePath` method signatures used consistently across Tasks 1–7. `ttlMinutes` named parameter used consistently in Tasks 5–7.
