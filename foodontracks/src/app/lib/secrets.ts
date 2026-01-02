import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";

const client = new SecretsManagerClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function getSecrets() {
  const secretId = process.env.SECRET_ARN;
  if (!secretId) {
    if (process.env.NODE_ENV === "development") {
      return {
        MOCK_SECRET_KEY: "mock-value",
        ANOTHER_KEY: "another-mock",
      } as Record<string, string>;
    }

    throw new Error("Missing environment variable: SECRET_ARN");
  }

  const command = new GetSecretValueCommand({ SecretId: secretId });
  const response = await client.send(command);

  if (!response || !response.SecretString) return {};

  try {
    return JSON.parse(response.SecretString);
  } catch {
    return {};
  }
}
