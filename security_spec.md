# Security Specification & Payload-First TDD

## 1. Data Invariants
1. **Strict Ownership**: Every document in `/users/{userId}`, `/projects/{projectId}`, `/tasks/{taskId}`, and `/works/{workId}` belongs strictly to a single authenticated and email-verified user (`request.auth.uid == ownerId` or `userId`). No cross-user reads, lists, updates, or deletes are permitted.
2. **PII Isolation**: `/users/{userId}` stores email and phone PII; `get` and `write` are restricted strictly to `request.auth.uid == userId`, with `allow list: if false` so user documents cannot be enumerated.
3. **Strict Schema & Size Bounds**: Every string has bounded `size()`, dates match `^\d{4}-\d{2}-\d{2}$`, enums are strictly allowlisted, and unknown shadow keys are rejected via `keys().hasOnly(...)`.
4. **Immutable Ownership & Temporal Integrity**: `ownerId`/`uid` and `createdAt` cannot be modified after creation. `createdAt` on create and `updatedAt` on create/update must equal `request.time`.
5. **Path Hardening**: All document IDs are validated with `isValidId(id)` matching `^[a-zA-Z0-9_\-]+$` and length `<= 128`.

## 2. The "Dirty Dozen" Attack Payloads (Expected: PERMISSION_DENIED)
1. **Unauthenticated Read/List**: Anonymous client calls `list` on `/projects` or `/tasks`.
2. **Cross-User Project Read**: Authenticated User B calls `get` on User A's `/projects/{projectId}`.
3. **User Enumeration**: Authenticated User B calls `list` on `/users`.
4. **Identity Spoofing on Create**: User A creates a `/projects/{id}` with `ownerId: "user_b_uid"`.
5. **Shadow / Ghost Field Injection**: User A creates `/tasks/{id}` including an extra field `isAdmin: true`.
6. **Owner Reassignment on Update**: User A updates `/projects/{id}` attempting to change `ownerId` to User B.
7. **Timestamp Forgery on Create**: User A creates `/projects/{id}` with a client-forged past `createdAt` instead of `request.time`.
8. **Immutable Timestamp Tampering**: User A updates `/tasks/{id}` attempting to overwrite `createdAt`.
9. **ID Poisoning**: User A writes to `/projects/invalid$id!with*bad^chars` or >128 chars.
10. **Value Poisoning (Oversized String)**: User A sets `name` on `/projects/{id}` to a 5,000-character string.
11. **Invalid Status Enum**: User A sets `status: "archived_hack"` on `/tasks/{id}`.
12. **Unverified Email Bypass**: A user token with `email_verified: false` attempts to write to `/projects/{id}`.
