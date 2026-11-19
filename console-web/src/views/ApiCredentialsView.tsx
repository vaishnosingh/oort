import React, { useState } from 'react';
import { UserProfile } from '../types';

interface ApiCredentialsViewProps {
  profile: UserProfile | null;
  currentBucket: string;
  onCopy: (text: string) => void;
}

export const ApiCredentialsView: React.FC<ApiCredentialsViewProps> = ({
  profile,
  currentBucket,
  onCopy,
}) => {
  const [showSecret, setShowSecret] = useState(false);
  const [activeTab, setActiveTab] = useState<'awscli' | 'boto3' | 'go' | 'nodejs' | 'rclone'>('awscli');

  const ak = profile?.access_key || 'YOUR_ACCESS_KEY';
  const sk = profile?.secret_key || 'YOUR_SECRET_KEY';
  const endpoint = 'https://oort.linuxguy.space';
  const bucket = currentBucket || 'mybucket';

  const getCodeSnippet = () => {
    switch (activeTab) {
      case 'awscli':
        return `# Configure AWS CLI Profile
aws configure set aws_access_key_id "${ak}" --profile oort
aws configure set aws_secret_access_key "${sk}" --profile oort
aws configure set default.region "us-east-1" --profile oort

# List objects
aws s3 ls s3://${bucket}/ --endpoint-url ${endpoint} --profile oort

# Sync local directory to Oort
aws s3 sync ./dist s3://${bucket}/assets --endpoint-url ${endpoint} --profile oort`;

      case 'boto3':
        return `import boto3

s3 = boto3.client(
    's3',
    endpoint_url='${endpoint}',
    aws_access_key_id='${ak}',
    aws_secret_access_key='${sk}',
    region_name='us-east-1'
)

# Upload object
s3.upload_file('data.csv', '${bucket}', 'exports/data.csv')

# List objects
for obj in s3.list_objects_v2(Bucket='${bucket}').get('Contents', []):
    print(obj['Key'], obj['Size'])`;

      case 'go':
        return `package main

import (
    "context"
    "fmt"
    "github.com/aws/aws-sdk-go-v2/aws"
    "github.com/aws/aws-sdk-go-v2/config"
    "github.com/aws/aws-sdk-go-v2/credentials"
    "github.com/aws/aws-sdk-go-v2/service/s3"
)

func main() {
    customResolver := aws.EndpointResolverWithOptionsFunc(func(service, region string, options ...interface{}) (aws.Endpoint, error) {
        return aws.Endpoint{URL: "${endpoint}"}, nil
    })

    cfg, _ := config.LoadDefaultConfig(context.TODO(),
        config.WithEndpointResolverWithOptions(customResolver),
        config.WithCredentialsProvider(credentials.NewStaticCredentialsProvider("${ak}", "${sk}", "")),
        config.WithRegion("us-east-1"),
    )

    client := s3.NewFromConfig(cfg, func(o *s3.Options) { o.UsePathStyle = true })
    resp, _ := client.ListObjectsV2(context.TODO(), &s3.ListObjectsV2Input{Bucket: aws.String("${bucket}")})
    for _, item := range resp.Contents {
        fmt.Println(*item.Key, item.Size)
    }
}`;

      case 'nodejs':
        return `import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  endpoint: "${endpoint}",
  region: "us-east-1",
  credentials: {
    accessKeyId: "${ak}",
    secretAccessKey: "${sk}",
  },
  forcePathStyle: true,
});

const res = await s3.send(new ListObjectsV2Command({ Bucket: "${bucket}" }));
console.log(res.Contents);`;

      case 'rclone':
        return `[oort]
type = s3
provider = Minio
env_auth = false
access_key_id = ${ak}
secret_access_key = ${sk}
endpoint = ${endpoint}
region = us-east-1
acl = private`;
    }
  };

  return (
    <div className="view-panel active" id="view-api">
      <div className="view-heading">
        <div className="view-title-group">
          <h1>
            <span>S3 API &amp; Credentials</span>
            <span className="badge badge-info">SigV4 Compatible</span>
          </h1>
          <p>Standard AWS S3 SDK access keys, endpoint definitions, and developer code integrations.</p>
        </div>
      </div>

      {/* Credentials Card */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Cluster API Credentials</div>
        </div>
        <div className="card-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className="form-group">
            <label className="form-label">Access Key ID (S3_KEY)</label>
            <div style={{ display: 'flex', gap: '6px' }}>
              <input type="text" id="api-access-key-input" className="form-input mono-cell" readOnly value={ak} />
              <button className="btn btn-secondary btn-sm" onClick={() => onCopy(ak)}>
                Copy
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Secret Access Key (S3_SECRET)</label>
            <div style={{ display: 'flex', gap: '6px' }}>
              <input
                type={showSecret ? 'text' : 'password'}
                id="api-secret-key-input"
                className="form-input mono-cell"
                readOnly
                value={sk}
              />
              <button className="btn btn-secondary btn-sm" onClick={() => setShowSecret(!showSecret)}>
                {showSecret ? 'Hide' : 'Show'}
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => onCopy(sk)}>
                Copy
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">S3 Endpoint URL</label>
            <div style={{ display: 'flex', gap: '6px' }}>
              <input type="text" id="api-endpoint-input" className="form-input mono-cell" readOnly value={endpoint} />
              <button className="btn btn-secondary btn-sm" onClick={() => onCopy(endpoint)}>
                Copy
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Default Region</label>
            <div style={{ display: 'flex', gap: '6px' }}>
              <input type="text" id="api-region-input" className="form-input mono-cell" readOnly value="us-east-1" />
              <button className="btn btn-secondary btn-sm" onClick={() => onCopy('us-east-1')}>
                Copy
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Code Snippets Guide */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Integration Code Templates</div>
        </div>
        <div className="filter-pills-bar" style={{ background: '#0f1623' }}>
          {(['awscli', 'boto3', 'go', 'nodejs', 'rclone'] as const).map((tab) => (
            <button
              key={tab}
              className={`filter-pill ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'awscli' && 'AWS CLI'}
              {tab === 'boto3' && 'Python (Boto3)'}
              {tab === 'go' && 'Go (AWS SDK v2)'}
              {tab === 'nodejs' && 'Node.js (@aws-sdk)'}
              {tab === 'rclone' && 'Rclone'}
            </button>
          ))}
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          <pre
            id="code-snippet-pre"
            style={{
              padding: '16px',
              background: '#0a0e17',
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              color: '#93c5fd',
              overflowX: 'auto',
              lineHeight: 1.6,
            }}
          >
            {getCodeSnippet()}
          </pre>
        </div>
      </div>
    </div>
  );
};
