#!/usr/bin/env node
/**
 * One-off: repair Content-Type on objects already in R2.
 *
 * Uploads used to omit ContentType, so every existing object is stored as
 * application/octet-stream. The upload helper now sets it correctly for new
 * files, but objects already in the bucket keep the metadata they were
 * written with — an SVG logo uploaded before the fix still will not render
 * in <img> until its Content-Type is corrected.
 *
 * S3-compatible stores change object metadata by copying an object onto
 * itself with MetadataDirective=REPLACE; that is what this does.
 *
 * Usage (from backend/, with .env present):
 *   node scripts/fix-r2-content-types.js                 # dry run: report only
 *   node scripts/fix-r2-content-types.js --apply         # rewrite mismatches
 *   node scripts/fix-r2-content-types.js --prefix Companies --prefix Blogs
 *
 * Without --prefix it walks the folders the app uploads into. Objects whose
 * extension is not in the helper's map are listed but left alone.
 */

const environment = require("../utils/environment");
const r2 = require("../helpers/r2.helper");
const {
    S3Client,
    ListObjectsV2Command,
    HeadObjectCommand,
    CopyObjectCommand,
} = require("@aws-sdk/client-s3");

const DEFAULT_PREFIXES = [
    "Companies",
    "CompanyRequests",
    "Blogs",
    "Events",
    "Reviews",
    "Users",
    "VerifiedTraderProofs",
];

const args = process.argv.slice(2);
const apply = args.includes("--apply");
const prefixes = [];
for (let i = 0; i < args.length; i++) {
    if (args[i] === "--prefix" && args[i + 1]) prefixes.push(args[++i]);
}
if (!prefixes.length) prefixes.push(...DEFAULT_PREFIXES);

const bucket = environment.r2.bucketName;
if (!bucket || !environment.r2.endpoint || !environment.r2.accessKeyId) {
    console.error("R2 is not configured — check R2_* variables in .env");
    process.exit(1);
}

const client = new S3Client({
    region: environment.r2.region,
    endpoint: environment.r2.endpoint,
    credentials: {
        accessKeyId: environment.r2.accessKeyId,
        secretAccessKey: environment.r2.secretAccessKey,
    },
    forcePathStyle: true,
});

async function* listKeys(prefix) {
    let ContinuationToken;
    do {
        const page = await client.send(
            new ListObjectsV2Command({ Bucket: bucket, Prefix: `${prefix}/`, ContinuationToken })
        );
        for (const obj of page.Contents || []) yield obj.Key;
        ContinuationToken = page.IsTruncated ? page.NextContinuationToken : undefined;
    } while (ContinuationToken);
}

(async () => {
    console.log(`${apply ? "APPLY" : "DRY RUN"} — bucket "${bucket}", prefixes: ${prefixes.join(", ")}\n`);
    const totals = { scanned: 0, ok: 0, fixed: 0, unknown: 0, failed: 0 };

    for (const prefix of prefixes) {
        for await (const key of listKeys(prefix)) {
            totals.scanned++;
            const wanted = r2.contentTypeFor(key);
            if (wanted === "application/octet-stream") {
                totals.unknown++;
                console.log(`  skip    ${key}  (extension not mapped)`);
                continue;
            }

            const head = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
            const current = head.ContentType || "(none)";
            if (current === wanted) {
                totals.ok++;
                continue;
            }

            console.log(`  ${apply ? "fix " : "would"}  ${key}  ${current} -> ${wanted}`);
            if (!apply) continue;

            try {
                await client.send(
                    new CopyObjectCommand({
                        Bucket: bucket,
                        Key: key,
                        CopySource: `/${bucket}/${encodeURIComponent(key).replace(/%2F/g, "/")}`,
                        MetadataDirective: "REPLACE",
                        ContentType: wanted,
                        // REPLACE drops user metadata unless re-supplied.
                        Metadata: head.Metadata || {},
                    })
                );
                totals.fixed++;
            } catch (err) {
                totals.failed++;
                console.error(`  FAILED  ${key}: ${err.message}`);
            }
        }
    }

    console.log(
        `\nscanned ${totals.scanned} · already correct ${totals.ok} · ` +
        `${apply ? "fixed" : "would fix"} ${apply ? totals.fixed : totals.scanned - totals.ok - totals.unknown} · ` +
        `unmapped ${totals.unknown} · failed ${totals.failed}`
    );
    if (!apply) console.log("Dry run only. Re-run with --apply to write changes.");
})().catch((err) => {
    console.error(err);
    process.exit(1);
});
