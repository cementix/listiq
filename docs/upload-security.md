# Upload and request protection

Apply the checked-in migration before running the new code:

```sh
npx prisma migrate deploy
npm run test:security
```

Set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` on the server; optionally set `CLOUDINARY_UPLOAD_FOLDER` (default `listiq`). Never expose the secret in client environment variables.

Both upload actions call `lib/uploads/upload.ts`: authenticate an existing user, validate file size/MIME and signature, consume a shared quota, upload with a random public ID, then save ownership and Cloudinary metadata in `UploadedAsset`. Failed validation/persistence triggers Cloudinary cleanup. Only JPEG, PNG, WebP, GIF, MP4, WebM and QuickTime are accepted; SVG and arbitrary URLs are rejected. Maximum file size is **3 MiB** and maximum dimensions are 40 megapixels. Next allows 4 MiB request bodies to leave multipart overhead below [Vercel's 4.5 MB limit](https://vercel.com/docs/functions/limitations). Larger videos require a separate direct-upload design.

Profile images, new titles, submissions and post attachments verify ownership and purpose against the database. Stored URL/type/dimensions are authoritative. Existing legacy images can remain unchanged on their own records; replacing them requires a new verified upload. Approval copies a submission's stored image without assigning it to the moderator.

Limits use atomic PostgreSQL upserts, not process memory. Windows start at the first allowed request, reset on expiry, and do not extend when blocked:

| Action | Limit |
| --- | --- |
| Login | 20 / 15 minutes per IP; 10 / 15 minutes per email |
| Registration | 5 / hour per IP |
| Password/username changes | 10 / 15 minutes per user |
| Uploads (both actions combined) | 20 / 10 minutes; 100 / day per user |
| Posts | 10 / 10 minutes per user |
| Comments/replies | 30 / 10 minutes per user |

Auth quotas are consumed after input validation and before database account lookup or bcrypt work. IP/email identities are SHA-256 hashed in `RateLimitBucket`; raw values are not stored there. On Vercel, auth uses its platform-provided `x-vercel-forwarded-for` header ([reference](https://vercel.com/docs/headers/request-headers)). Local/self-hosted auth shares one fallback IP bucket; don't trust arbitrary client headers to remove this protection. Account quotas can temporarily block a targeted email; expiry restores access. Database failures fail closed.

The existing daily sync cron removes expired rate-limit buckets. Schedule it for production; without it counters still reset but old keys accumulate. Upload records do not currently expire: deleting orphaned Cloudinary files requires checking all profile, title, submission and post references first.

Security tests use mocked database/Cloudinary responses and local file fixtures. They cover anonymous-upload rejection, ownership, metadata tampering, file validation, quota admission/rejection, fail-closed behavior and cleanup on persistence failure. They do not replace concurrent PostgreSQL tests or a Cloudinary smoke test.
