# app/services/s3.py

import boto3
import os

from app.utils.config import settings

s3 = boto3.client(
    "s3",
    region_name=settings.aws_region,
    aws_access_key_id=settings.aws_access_key_id,
    aws_secret_access_key=settings.aws_secret_access_key,
)

BUCKET_NAME = settings.s3_bucket_name