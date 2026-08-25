"""R2/S3-compatible object storage for agency brand assets."""

import os
from uuid import UUID, uuid4

import boto3
from botocore.config import Config


ALLOWED_LOGO_TYPES = {"image/png": "png", "image/svg+xml": "svg", "image/webp": "webp"}
LOGO_MAX_BYTES = 2 * 1024 * 1024
LOGO_URL_TTL = 300


class ObjectStorageNotConfigured(RuntimeError):
    pass


class ObjectStorage:
    def __init__(self) -> None:
        account_id = os.getenv("R2_ACCOUNT_ID")
        access_key = os.getenv("R2_ACCESS_KEY_ID")
        secret_key = os.getenv("R2_SECRET_ACCESS_KEY")
        bucket = os.getenv("R2_BUCKET")
        public_url = os.getenv("R2_PUBLIC_URL")
        if not all((account_id, access_key, secret_key, bucket, public_url)):
            raise ObjectStorageNotConfigured("Object storage is not configured")
        self.bucket = bucket
        self.public_url = public_url.rstrip("/")
        self.client = boto3.client(
            "s3",
            endpoint_url=f"https://{account_id}.r2.cloudflarestorage.com",
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key,
            region_name="auto",
            config=Config(signature_version="s3v4"),
        )

    def create_logo_upload(self, organization_id: UUID, content_type: str) -> dict[str, str | int]:
        extension = ALLOWED_LOGO_TYPES[content_type]
        key = f"organizations/{organization_id}/brand/logo-{uuid4()}.{extension}"
        upload_url = self.client.generate_presigned_url(
            "put_object",
            Params={"Bucket": self.bucket, "Key": key, "ContentType": content_type},
            ExpiresIn=LOGO_URL_TTL,
            HttpMethod="PUT",
        )
        return {
            "upload_url": upload_url,
            "public_url": f"{self.public_url}/{key}",
            "expires_in": LOGO_URL_TTL,
            "max_bytes": LOGO_MAX_BYTES,
        }
