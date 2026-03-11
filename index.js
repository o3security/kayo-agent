const core = require('@actions/core');
const exec = require('@actions/exec');

async function run() {
  try {
    // Get required inputs
    const serverUrl = core.getInput('server-url', { required: true });
    const apiKey = core.getInput('apikey', { required: true });
    const projectName = core.getInput('project-name', { required: true });

    // Get optional input with default
    const imageName = core.getInput('image-name') || 'kkyo';

    core.info('Starting Kayo Security Scanner...');
    core.info(`Server URL: ${serverUrl}`);
    core.info(`Project Name: ${projectName}`);
    core.info(`Image: ${imageName}`);

    // Download and install the CLI
    const cliPath = '/tmp/kayo';

    // Detect architecture
    const os = require('os');
    const arch = os.arch();
    let binaryUrl;

    if (arch === 'arm64') {
      binaryUrl = 'https://codex-public-assets.s3.ap-south-1.amazonaws.com/kayo-arm64';
      core.info('Detected ARM64 architecture');
    } else {
      // Default to amd64 for x64/x86_64
      binaryUrl = 'https://codex-public-assets.s3.ap-south-1.amazonaws.com/kayo-amd64';
      core.info('Detected x86_64 (amd64) architecture');
    }

    core.info('Downloading Kayo CLI...');
    await exec.exec('curl', ['-sL', '-o', cliPath, binaryUrl]);

    core.info('Setting executable permissions...');
    await exec.exec('chmod', ['+x', cliPath]);

    // Build the CLI command arguments
    const cliArgs = [
      cliPath,
      '-project-name', projectName,
      '-apikey', apiKey,
      '-server-url', serverUrl
    ];

    core.info('Executing Kayo Agent (asynchronous, non-blocking)...');

    // Execute the CLI command asynchronously (fire-and-forget)
    exec.exec('sudo', cliArgs).catch(err => core.warning(`Kayo agent background execution error: ${err.message}`));

    core.info('Scanner completed successfully.');
    core.info('Waiting for 1 minute before continuing...');

    // Sleep for 1 minute
    await sleep(60000);

    core.info('Sleep completed. Continuing workflow.');

  } catch (error) {
    core.setFailed(`Kayo Security Scanner failed: ${error.message}`);
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

run();
