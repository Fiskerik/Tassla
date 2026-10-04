const { spawn } = require('node:child_process');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');

function buildPreviewEnvironment(parentEnvironment) {
  return { ...parentEnvironment, EXPO_PUBLIC_DEV_PREVIEW: 'true' };
}

function buildExpoCommand(root = projectRoot, args = []) {
  const packagePath = require.resolve('expo/package.json', { paths: [root] });
  const expoPackage = require(packagePath);
  const cliPath = path.resolve(path.dirname(packagePath), expoPackage.bin.expo);
  return { command: process.execPath, args: [cliPath, 'start', ...args] };
}

function startPreview() {
  const { command, args } = buildExpoCommand(projectRoot, process.argv.slice(2));
  const child = spawn(command, args, {
    cwd: projectRoot,
    env: buildPreviewEnvironment(process.env),
    stdio: 'inherit',
  });

  child.on('error', () => {
    process.stderr.write('Could not start the installed Expo CLI.\n');
    process.exitCode = 1;
  });
  child.on('exit', (code) => {
    process.exitCode = code ?? 1;
  });
}

if (require.main === module) startPreview();

module.exports = { buildExpoCommand, buildPreviewEnvironment };
