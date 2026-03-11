const core = require('@actions/core');
const exec = require('@actions/exec');
const fs = require('fs');
const path = require('path');
const os = require('os');

async function run() {
  try {
    // Get required inputs
    const serverUrl = core.getInput('server-url', { required: true });
    const apiKey = core.getInput('apikey', { required: true });
    const projectName = core.getInput('project-name', { required: true });

    // Get optional input with default
    const imageName = core.getInput('image-name') || 'public.ecr.aws/f9o7b7m0/kayo';

    core.info('Starting Kayo Security Scanner...');
    core.info(`Server URL: ${serverUrl}`);
    core.info(`Project Name: ${projectName}`);
    core.info(`Image: ${imageName}`);

    const containerName = 'kayo-final-test';
    const workDir = '/tmp/kayo-docker';

    // Stop any existing container with the same name
    core.info('Cleaning up any existing Kayo container...');
    await exec.exec('docker', ['stop', containerName], { ignoreReturnCode: true });
    await exec.exec('docker', ['rm', '-f', containerName], { ignoreReturnCode: true });

    // Detect architecture and download binary
    const arch = os.arch();
    let binaryUrl;
    let platform;

    if (arch === 'arm64') {
      binaryUrl = 'https://codex-public-assets.s3.ap-south-1.amazonaws.com/kayo-arm64';
      platform = 'linux/arm64';
      core.info('Detected ARM64 architecture');
    } else {
      binaryUrl = 'https://codex-public-assets.s3.ap-south-1.amazonaws.com/kayo-amd64';
      platform = 'linux/amd64';
      core.info('Detected x86_64 (amd64) architecture');
    }

    // Create working directory
    core.info('Creating working directory...');
    fs.mkdirSync(workDir, { recursive: true });

    // Download the binary
    const binaryPath = path.join(workDir, 'kayo');
    core.info('Downloading Kayo binary...');
    await exec.exec('curl', ['-sL', '-o', binaryPath, binaryUrl]);

    // Make executable
    core.info('Setting executable permissions...');
    fs.chmodSync(binaryPath, '755');

    // Create Dockerfile
    core.info('Creating Dockerfile...');
    const dockerfile = `FROM alpine:latest

RUN apk add --no-cache curl ca-certificates

WORKDIR /app
COPY kayo /app/kayo

ENTRYPOINT ["/app/kayo"]
`;
    fs.writeFileSync(path.join(workDir, 'Dockerfile'), dockerfile);

    // Build Docker image
    const imageTag = 'kayo-agent:local';
    core.info('Building Docker image...');
    await exec.exec('docker', ['build', '-t', imageTag, '-f', path.join(workDir, 'Dockerfile'), workDir]);

    // Build the CLI command arguments
    const cliArgs = [
      '-project-name', projectName,
      '-apikey', apiKey,
      '-server-url', serverUrl
    ];

    core.info('Executing Kayo Agent in privileged container (asynchronous, non-blocking)...');

    // Run Kayo in a privileged Docker container in the background
    const dockerArgs = [
      'run',
      '-d',
      '--name', containerName,
      '--privileged',
      '--pid=host',
      '--cgroupns=host',
      '-v', '/sys/fs/cgroup:/sys/fs/cgroup:ro',
      '-v', '/var/run/docker.sock:/var/run/docker.sock',
      imageTag,
      ...cliArgs
    ];

    await exec.exec('docker', dockerArgs);

    core.info(`Kayo container started: ${containerName}`);

    // Wait a few seconds for container to initialize
    await sleep(5000);

    // Show container logs for debugging
    core.info('--- Kayo Container Logs ---');
    await exec.exec('docker', ['logs', containerName], { ignoreReturnCode: true });
    core.info('--- End Logs ---');

    core.info('Scanner completed successfully.');
    core.info('Waiting for 1 minute before continuing...');

    // Sleep for 1 minute to allow Kayo to initialize
    await sleep(60000);

    // Show final logs
    core.info('--- Final Kayo Container Logs ---');
    await exec.exec('docker', ['logs', containerName], { ignoreReturnCode: true });
    core.info('--- End Final Logs ---');

    core.info('Sleep completed. Continuing workflow.');
    core.info('Kayo container will continue running in the background.');
    core.info('Use the cleanup step in your workflow to stop it.');

  } catch (error) {
    core.setFailed(`Kayo Security Scanner failed: ${error.message}`);
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

run();
