#!/usr/bin/env python3
"""
nova_reel.py — Amazon Nova Reel video generation via AWS Bedrock.

Supports:
  - Text-to-video
  - Image-to-video (image as first frame)

Output lands in s3://nebula-video-output/<job_id>/output.mp4
Downloaded automatically to ~/Videos/nebula-shoots/ on completion.

Usage:
  python3 nova_reel.py --prompt "A dark monitor glowing..." --duration 6
  python3 nova_reel.py --prompt "..." --image /path/to/still.png --duration 6
  python3 nova_reel.py --status <invocation_arn>   # poll existing job
  python3 nova_reel.py --queue                      # process video_queue table
"""

import argparse, base64, json, os, sys, time
from pathlib import Path

import boto3

# ── Config ────────────────────────────────────────────────────────────────────

PROFILE    = "hermes-runtime"
REGION     = "us-east-1"
MODEL_ID   = "amazon.nova-reel-v1:0"
S3_BUCKET  = "nebula-video-output"
OUT_DIR    = Path.home() / "Videos" / "nebula-shoots"
POLL_EVERY = 15   # seconds between status checks

VISUAL_DNA = (
    "RED Komodo, 35mm anamorphic lens, soft monitor-glow practicals, "
    "near-black with teal accent, light film grain, slight vignette"
)

OUT_DIR.mkdir(parents=True, exist_ok=True)


# ── AWS clients ───────────────────────────────────────────────────────────────

def _session():
    return boto3.Session(profile_name=PROFILE, region_name=REGION)


def _bedrock():
    return _session().client("bedrock-runtime")


def _s3():
    return _session().client("s3")


# ── Core generation ───────────────────────────────────────────────────────────

def submit_text_to_video(prompt: str, duration: int = 6, seed: int | None = None) -> str:
    """Submit a text-to-video job. Returns invocation ARN."""
    client = _bedrock()
    model_input = {
        "taskType": "TEXT_VIDEO",
        "textToVideoParams": {"text": prompt},
        "videoGenerationConfig": {
            "durationSeconds": duration,
            "fps": 24,
            "dimension": "1280x720",
        },
    }
    if seed is not None:
        model_input["videoGenerationConfig"]["seed"] = seed

    resp = client.start_async_invoke(
        modelId=MODEL_ID,
        modelInput=model_input,
        outputDataConfig={"s3OutputDataConfig": {"s3Uri": f"s3://{S3_BUCKET}"}},
    )
    arn = resp["invocationArn"]
    print(f"Submitted: {arn}")
    return arn


def submit_image_to_video(prompt: str, image_path: str, duration: int = 6, seed: int | None = None) -> str:
    """Submit an image-to-video job. Returns invocation ARN."""
    client = _bedrock()

    img_bytes = Path(image_path).read_bytes()
    img_b64 = base64.b64encode(img_bytes).decode()
    ext = Path(image_path).suffix.lower().lstrip(".")
    mime = {"jpg": "image/jpeg", "jpeg": "image/jpeg",
            "png": "image/png", "webp": "image/webp"}.get(ext, "image/png")

    model_input = {
        "taskType": "TEXT_VIDEO",
        "textToVideoParams": {
            "text": prompt,
            "images": [{"format": mime.split("/")[1], "source": {"bytes": img_b64}}],
        },
        "videoGenerationConfig": {
            "durationSeconds": duration,
            "fps": 24,
            "dimension": "1280x720",
        },
    }
    if seed is not None:
        model_input["videoGenerationConfig"]["seed"] = seed

    resp = client.start_async_invoke(
        modelId=MODEL_ID,
        modelInput=model_input,
        outputDataConfig={"s3OutputDataConfig": {"s3Uri": f"s3://{S3_BUCKET}"}},
    )
    arn = resp["invocationArn"]
    print(f"Submitted (image-to-video): {arn}")
    return arn


def poll_and_download(arn: str, output_name: str | None = None) -> Path | None:
    """Poll until complete, download output.mp4, return local path."""
    client = _bedrock()
    s3 = _s3()
    job_id = arn.split("/")[-1]
    s3_prefix = job_id

    print(f"Polling job {job_id}...")
    while True:
        resp = client.get_async_invoke(invocationArn=arn)
        status = resp["status"]
        print(f"  Status: {status}")
        if status == "Completed":
            break
        if status in ("Failed", "Cancelled"):
            msg = resp.get("failureMessage", "no detail")
            print(f"Job {status}: {msg}")
            return None
        time.sleep(POLL_EVERY)

    # Download
    s3_key = f"{s3_prefix}/output.mp4"
    dest = OUT_DIR / (output_name or f"nova_{job_id[:8]}.mp4")
    print(f"Downloading s3://{S3_BUCKET}/{s3_key} → {dest}")
    s3.download_file(S3_BUCKET, s3_key, str(dest))
    size_mb = dest.stat().st_size / 1e6
    print(f"Done: {dest.name} ({size_mb:.1f}MB)")
    return dest


# ── Queue integration ─────────────────────────────────────────────────────────

def process_queue(limit: int = 3):
    """Pull queued shots from Postgres video_queue and generate them."""
    try:
        import psycopg2, psycopg2.extras
    except ImportError:
        print("pip install psycopg2-binary")
        sys.exit(1)

    dsn = os.environ.get(
        "AUDIT_DATABASE_URL",
        "host=/var/run/postgresql port=5433 dbname=nebula_audit user=postgres"
    )

    with psycopg2.connect(dsn) as conn, conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cur:
        cur.execute(
            "SELECT * FROM video_queue WHERE status='queued' ORDER BY created_at LIMIT %s",
            (limit,)
        )
        shots = cur.fetchall()

    if not shots:
        print("No queued shots.")
        return

    for shot in shots:
        sid   = shot["id"]
        brief = shot["brief"]
        anchor = shot.get("visual_dna_anchor") or VISUAL_DNA
        dur   = shot.get("duration") or 6
        dur   = max(6, min(int(dur), 120))  # Nova Reel: 6–120s, multiples of 6
        # Round up to nearest multiple of 6
        dur = ((dur + 5) // 6) * 6

        prompt = f"{brief}. {anchor}. Photoreal, shallow depth of field, no text overlays."

        print(f"\n[{sid}] {brief[:60]}")
        print(f"  Duration: {dur}s | Prompt length: {len(prompt)} chars")

        # Mark rendering
        with psycopg2.connect(dsn) as conn, conn.cursor() as cur:
            cur.execute(
                "UPDATE video_queue SET status='rendering', updated_at=now() WHERE id=%s",
                (sid,)
            )

        try:
            arn = submit_text_to_video(prompt, duration=dur)
            local = poll_and_download(arn, output_name=f"nova_{sid}.mp4")

            if local:
                with psycopg2.connect(dsn) as conn, conn.cursor() as cur:
                    cur.execute(
                        "UPDATE video_queue SET status='done', output_url=%s, updated_at=now() WHERE id=%s",
                        (str(local), sid)
                    )
                print(f"  ✓ Done → {local}")
            else:
                with psycopg2.connect(dsn) as conn, conn.cursor() as cur:
                    cur.execute(
                        "UPDATE video_queue SET status='failed', updated_at=now() WHERE id=%s",
                        (sid,)
                    )
        except Exception as e:
            print(f"  ✗ Error: {e}")
            with psycopg2.connect(dsn) as conn, conn.cursor() as cur:
                cur.execute(
                    "UPDATE video_queue SET status='failed', updated_at=now() WHERE id=%s",
                    (sid,)
                )


# ── CLI ───────────────────────────────────────────────────────────────────────

def main():
    p = argparse.ArgumentParser(description="Nova Reel video generation")
    p.add_argument("--prompt",   help="Video generation prompt")
    p.add_argument("--image",    help="Input image path (image-to-video)")
    p.add_argument("--duration", type=int, default=6, help="Duration in seconds (6–120, multiple of 6)")
    p.add_argument("--seed",     type=int, default=None)
    p.add_argument("--output",   help="Output filename (default: nova_<jobid>.mp4)")
    p.add_argument("--status",   help="Poll existing invocation ARN")
    p.add_argument("--queue",    action="store_true", help="Process video_queue table")
    p.add_argument("--limit",    type=int, default=3, help="Max shots to process from queue")

    args = p.parse_args()

    if args.status:
        poll_and_download(args.status, args.output)
    elif args.queue:
        process_queue(limit=args.limit)
    elif args.prompt:
        dur = max(6, ((args.duration + 5) // 6) * 6)
        if args.image:
            arn = submit_image_to_video(args.prompt, args.image, duration=dur, seed=args.seed)
        else:
            arn = submit_text_to_video(args.prompt, duration=dur, seed=args.seed)
        poll_and_download(arn, args.output)
    else:
        p.print_help()


if __name__ == "__main__":
    main()
