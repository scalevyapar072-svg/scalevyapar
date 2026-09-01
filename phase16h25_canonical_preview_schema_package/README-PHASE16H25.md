# Phase 16H.25 — Canonical Git-Safe Preview Schema Package

Status: local packaging and static validation only as of 2026-08-31.

This package is the canonical Git-safe Preview schema bundle assembled only from successfully retained, hash-verified Phase 16H artifacts. It preserves the copied SQL payloads byte-for-byte and adds a sanitized runbook, a package-specific static validator, and a complete SHA-256 manifest.

## Included files

- `00-preview-read-only-preflight.sql`
- `01-preview-schema-payload.sql`
- `02-preview-transactional-application-utf8-corrected.sql`
- `03-preview-read-only-schema-verification.sql`
- `04-preview-transactional-privilege-correction.sql`
- `05-preview-read-only-privilege-verification.sql`
- `06-static-validate-phase16h25.ps1`
- `README-PHASE16H25.md`
- `SHA256SUMS.txt`

## Canonical source hashes preserved

- `00-preview-read-only-preflight.sql`
  `26D84F72BC95CE143DC06F67BCBAC7E8631A236332C92AD543244B9E25EABF7E`
- `01-preview-schema-payload.sql`
  `202606E35550562292F9740651DA949DE4F3D5A99154742E48F679EF3FFEC480`
- `02-preview-transactional-application-utf8-corrected.sql`
  `C098A44BC912532D92F93B2BB5FD3D1FAEF50C93BB161ED493997BDAF1CD90EF`
- `03-preview-read-only-schema-verification.sql`
  `3C5C77DB9CB4635BA6CECA3A2F79FD7FCFE7536947B334664817D1029C5A2180`
- `04-preview-transactional-privilege-correction.sql`
  `C3C7243651CB0CFB020667705C75A7D243E56332362A1CCFC09B4C50CE856FD2`
- `05-preview-read-only-privilege-verification.sql`
  `421931ADFE0D0D586E6B326C98A1ABE998E78C79C0668380DA646B2ACBB6BDA1`

## Excluded from this canonical package

- the defective non-UTF-8-preserved transactional application file
- raw non-canonical schema review artifacts
- superseded local runner generations
- workstation-specific absolute paths
- credentials, hosted-sensitive material, and temporary artifacts

## Static guarantees checked by the validator

- all package file hashes match `SHA256SUMS.txt`
- the manifest records the embedded schema payload hash sentinel
- the copied schema payload hash is exactly `202606E35550562292F9740651DA949DE4F3D5A99154742E48F679EF3FFEC480`
- the copied UTF-8-corrected transactional application hash is exactly `C098A44BC912532D92F93B2BB5FD3D1FAEF50C93BB161ED493997BDAF1CD90EF`
- the copied privilege correction and verification hashes match the retained Phase 16H.16 values
- the transactional application and privilege correction each contain one `begin;` and one `commit;`
- the read-only SQL files do not contain mutation statements
- the package contains no `COPY` data blocks
- the Git-safe wrapper files contain no workstation paths, credentials, database URLs, raw hosted URLs, non-canonical hosted identifiers, or scheduler/Vault wiring
- the manifest covers exactly this canonical package

## Local static validation

Run locally from PowerShell:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force
& ".\phase16h25_canonical_preview_schema_package\06-static-validate-phase16h25.ps1"
```

This package does not authorize database contact, SQL execution, Docker actions, deployment, or any hosted environment change.
