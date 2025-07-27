/**
 * TypeScript declarations for @itsmarathon/eqcadt-models
 */

export interface ModelConfig {
  name: string;
  version: string;
  description: string;
  source: {
    huggingface_model: string;
    original_license: string;
    conversion_date: string;
    optimization: string;
  };
  files: {
    assembled: {
      filename: string;
      size_bytes: number;
      size_human: string;
      sha256: string;
    };
    chunks: {
      directory: string;
      pattern: string;
      count: number;
      chunk_size_bytes: number;
      chunk_size_human: string;
      checksums: Record<string, string>;
    };
  };
  runtime: {
    supported_providers: string[];
    target_platform: string;
    onnxruntime_version: string;
  };
  performance: {
    inference_time_ms: string;
    memory_usage_mb: string;
    recommended_concurrency: number;
  };
  use_case: {
    task: string;
    application: string;
    input_format: string;
    output_format: string;
  };
}

export interface ModelManifest {
  models: {
    'bart-nli-web': ModelConfig;
  };
}

/**
 * Get the assembled model as ArrayBuffer
 * Automatically assembles from chunks if needed (Node.js only)
 */
export function getModel(): Promise<ArrayBuffer>;

/**
 * Get model file path (for Node.js usage)
 * Automatically assembles from chunks if needed
 */
export function getModelPath(): string;

/**
 * Get model for web environments by downloading and assembling chunks
 * This is used when the package chunks need to be fetched from CDN/GitHub
 * Includes full SHA256 verification like the Node.js version
 */
export function getModelWeb(baseUrl?: string): Promise<ArrayBuffer>;

/**
 * Get model manifest
 */
export function getManifest(): ModelConfig;

/**
 * Model configuration object
 */
export const MODEL_CONFIG: ModelConfig;