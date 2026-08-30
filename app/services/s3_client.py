import boto3

# Initialize the low-level S3 client
s3_client = boto3.client('s3')

# Example: List all your S3 buckets
response = s3_client.list_buckets()

print("Your buckets:")
for bucket in response.get('Buckets', []):
    print(f" - {bucket['Name']}")
