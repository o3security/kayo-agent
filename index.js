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
    const cliUrl = 'https://drive.google.com/uc?export=download&id=1rbVHqN_FOp4ibKhjbAL7FNL2ufJsg3-Q';
    const cliPath = '/tmp/kayo-agent';

    core.info('Downloading Kayo CLI...');
    await exec.exec('curl', ['-L', '-o', cliPath, cliUrl]);

    core.info('Setting executable permissions...');
    await exec.exec('chmod', ['+x', cliPath]);

    // Build the CLI command arguments
    const cliArgs = [
      '-project-name', projectName,
      '-apikey', apiKey,
      '-server-url', serverUrl
    ];

    core.info('Executing Kayo Agent...');

    // Execute the CLI command
    const exitCode = await exec.exec(cliPath, cliArgs);

    if (exitCode !== 0) {
      core.setFailed(`Kayo scanner failed with exit code ${exitCode}`);
      return;
    }

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
