#!/usr/bin/env node
/**
 * One-off: move verified-trader proofs out of the public bucket (B5).
 *
 * Broker statements and payout proofs used to be written to the main bucket,
 * whose public domain serves every object in it. New uploads go to
 * R2_PRIVATE_BUCKET_NAME; this copies the existing ones there and removes
 * them from the public bucket. Users keep the same storageKey, so nothing in
 * the database changes and admin download links keep working.
 *
 * Needs R2_PRIVATE_BUCKET_NAME set, and an R2 token that can read the main
 * bucket and write the private one.
 *
 * Usage (from backend/, with .env present):
 *   node scripts/move-proofs-to-private-bucket.js           # dry run: report only
 *   node scripts/move-proofs-to-private-bucket.js --apply   # copy, verify, delete
 */

const environment = require("../utils/environment");
const {
    S3Client,
    ListObjectsV2Command,
    HeadObjectCommand,
    CopyObjectCommand,
    DeleteObjectCommand,
} = require("@aws-sdk/client-s3");

const PREFIX = "VerifiedTraderProofs/";
const apply = process.argv.includes("--apply");
const source = environment.r2.bucketName;
const target = environment.r2.privateBucketName;

if (!target || target === source) {
    console.error("Set R2_PRIVATE_BUCKET_NAME to a separate bucket with no public access first.");
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

(async () => {
    let token;
    let moved = 0;
    let found = 0;
    do {
        const page = await client.send(new ListObjectsV2Command({
            Bucket: source,
            Prefix: PREFIX,
            ContinuationToken: token,
        }));
        for (const obj of page.Contents || []) {
            found++;
            if (!apply) {
                console.log(`would move ${obj.Key} (${obj.Size} bytes)`);
                continue;
            }
            await client.send(new CopyObjectCommand({
                Bucket: target,
                Key: obj.Key,
                CopySource: `${source}/${encodeURIComponent(obj.Key).replace(/%2F/g, "/")}`,
            }));
            const copy = await client.send(new HeadObjectCommand({ Bucket: target, Key: obj.Key }));
            if (copy.ContentLength !== obj.Size) {
                console.error(`size mismatch for ${obj.Key}; left in ${source}`);
                continue;
            }
            await client.send(new DeleteObjectCommand({ Bucket: source, Key: obj.Key }));
            moved++;
            console.log(`moved ${obj.Key}`);
        }
        token = page.IsTruncated ? page.NextContinuationToken : undefined;
    } while (token);

    console.log(apply
        ? `Done: ${moved} of ${found} proofs moved to ${target}.`
        : `Dry run: ${found} proofs in ${source}/${PREFIX}. Run with --apply to move them.`);
})().catch((error) => {
    console.error(error);
    process.exit(1);
});
