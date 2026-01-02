import { NextResponse } from "next/server";
import AWS from "aws-sdk";
import withLogging from "@/lib/requestLogger";

const s3 = new AWS.S3({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});
export const GET = withLogging(async (req: Request) => {
  const { searchParams } = new URL(req.url);
  const fileName = searchParams.get("fileName");
  const fileType = searchParams.get("fileType");

  if (!fileName || !fileType) {
    return NextResponse.json({ error: "Invalid params" }, { status: 400 });
  }

  const uploadUrl = await s3.getSignedUrlPromise("putObject", {
    Bucket: process.env.AWS_BUCKET_NAME!,
    Key: fileName,
    ContentType: fileType,
    Expires: 60,
  });

  return NextResponse.json({ uploadUrl });
});
