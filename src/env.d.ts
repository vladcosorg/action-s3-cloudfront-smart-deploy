interface ImportMetaEnvironment {
  [key: string]: any
  VITE_BUCKET_ID?: string
  VITE_CLOUDFRONT_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnvironment
}
