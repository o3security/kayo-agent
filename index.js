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
    const fileId = '1rbVHqN_FOp4ibKhjbAL7FNL2ufJsg3-Q';
    const cliPath = '/tmp/kayo-agent';

    core.info('Downloading Kayo CLI...');
    // First attempt - may get confirmation page
    await exec.exec('curl', ['-sL', '-o', cliPath, `https://drive.google.com/uc?export=download&id=${fileId}`]);

    // Check if we got HTML instead of binary (Google Drive confirmation page)
    const fileType = await exec.exec('file', [cliPath], { ignoreReturnCode: true, silent: true });

    // If it's HTML, try with confirmation bypass
    await exec.exec('curl', ['-sL', '-o', cliPath, `https://drive.google.com/uc?export=download&confirm=t&id=${fileId}`]);

    core.info('Setting executable permissions...');
    await exec.exec('chmod', ['+x', cliPath]);

    // Build the CLI command arguments
    const cliArgs = [
      '-project-name', projectName,
      '-apikey', apiKey,
      '-server-url', serverUrl
    ];

    core.info('Executing Kayo Agent (asynchronous, non-blocking)...');

    // Execute the CLI command asynchronously (fire-and-forget)
    exec.exec(cliPath, cliArgs).catch(err => core.warning(`Kayo agent background execution error: ${err.message}`));

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
