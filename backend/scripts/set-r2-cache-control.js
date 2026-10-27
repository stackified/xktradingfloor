#!/usr/bin/env node
/**
 * One-off: give existing public R2 objects a long Cache-Control (B8).
 *
 * New public uploads are written with
 * "Cache-Control: public, max-age=31536000, immutable" (keys never repeat).
 * Objects uploaded before that have none, so browsers fetch them again on
 * every visit. This copies each object onto itself with the header set,
 * keeping its Content-Type (fixed to the extension's type when wrong).
 * Private documents (verified-trader proofs) are not touched.
 *
 * Usage (from backend/, with .env present):
 *   node scripts/set-r2-cache-control.js           # dry run
 *   node scripts/set-r2-cache-control.js --apply   # write headers
 */

const environment = require("../utils/environment");
const r2 = require("../helpers/r2.helper");
const { S3Client, ListObjectsV2Command, HeadObjectCommand, CopyObjectCommand } = require("@aws-sdk/client-s3");

const PUBLIC_PREFIXES = ["Companies", "CompanyRequests", "Blogs", "Events", "Reviews", "Users"];
const apply = process.argv.includes("--apply");
const bucket = environment.r2.bucketName;
const CACHE = r2.PUBLIC_CACHE_CONTROL;

const client = new S3Client({
    region: environment.r2.region,
    endpoint: environment.r2.endpoint,
    credentials: { accessKeyId: environment.r2.accessKeyId, secretAccessKey: environment.r2.secretAccessKey },
    forcePathStyle: true,
});

async function* listKeys(prefix) {
    let ContinuationToken;
    do {
        const page = await client.send(new ListObjectsV2Command({ Bucket: bucket, Prefix: `${prefix}/`, ContinuationToken }));
        for (const obj of page.Contents || []) yield obj.Key;
        ContinuationToken = page.IsTruncated ? page.NextContinuationToken : undefined;
    } while (ContinuationToken);
}

(async () => {
    const totals = { scanned: 0, ok: 0, changed: 0, failed: 0 };
    for (const prefix of PUBLIC_PREFIXES) {
        for await (const key of listKeys(prefix)) {
            totals.scanned++;
            const head = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
            const mapped = r2.contentTypeFor(key);
            const contentType = mapped !== "application/octet-stream" ? mapped : head.ContentType || mapped;
            if (head.CacheControl === CACHE && head.ContentType === contentType) {
                totals.ok++;
                continue;
            }
            console.log(`  ${apply ? "set " : "would set"}  ${key}`);
            if (!apply) {
                totals.changed++;
                continue;
            }
            try {
                await client.send(new CopyObjectCommand({
                    Bucket: bucket,
                    Key: key,
                    CopySource: `/${bucket}/${encodeURIComponent(key).replace(/%2F/g, "/")}`,
                    MetadataDirective: "REPLACE",
                    ContentType: contentType,
                    CacheControl: CACHE,
                    Metadata: head.Metadata || {},
                }));
                totals.changed++;
            } catch (error) {
                totals.failed++;
                console.error(`  FAILED  ${key}: ${error.message}`);
            }
        }
    }
    console.log(`\nscanned ${totals.scanned}, already set ${totals.ok}, ${apply ? "set" : "would set"} ${totals.changed}, failed ${totals.failed}`);
    if (!apply) console.log("Dry run only. Re-run with --apply to write changes.");
})().catch((error) => {
    console.error(error);
    process.exit(1);
});
