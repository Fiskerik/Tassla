const fs = require('node:fs');
const path = require('node:path');

const reviewFlag = process.env.EXPO_PUBLIC_TASSLA_REVIEW_CONTENT;
const channel = process.env.TASSLA_BUILD_CHANNEL;
const allowed = (channel === 'review' && reviewFlag === 'true') || (channel === 'public' && reviewFlag === 'false');

if (!allowed) {
  console.error('Content build guard: set TASSLA_BUILD_CHANNEL=review with EXPO_PUBLIC_TASSLA_REVIEW_CONTENT=true, or public with the flag=false.');
  process.exitCode = 1;
} else {
  const outputDir = process.env.CM_BUILD_DIR || process.cwd();
  const logDir = path.join(outputDir, 'codemagic-logs');
  fs.mkdirSync(logDir, { recursive: true });
  const metadata = { channel, reviewContentEnabled: reviewFlag === 'true' };
  fs.writeFileSync(path.join(logDir, 'content-build-metadata.json'), `${JSON.stringify(metadata, null, 2)}\n`, { flag: 'w' });
  console.log(`Content build guard passed for ${channel} channel.`);
}
