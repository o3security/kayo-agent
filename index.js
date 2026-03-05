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

    // Build the docker run command
    const dockerArgs = [
      'run', '-d', '--privileged', '--pid=host', '--net=host',
      '-v', '/:/host:ro',
      '-v', '/sys:/sys:rw',
      '-v', '/proc:/proc:ro',
      '-v', '/lib:/lib:ro',
      '-v', '/usr:/usr:ro',
      '-v', '/etc/ld.so.cache:/etc/ld.so.cache:ro',
      '-v', '/etc/ld.so.conf:/etc/ld.so.conf:ro',
      '-v', '/etc/ld.so.conf.d:/etc/ld.so.conf.d:ro',
      '-v', '/var/run/docker.sock:/var/run/docker.sock',
      '-v', '/run/containerd/containerd.sock:/run/containerd/containerd.sock',
      '-v', '/var/lib/docker:/var/lib/docker:ro',
      '-v', '/opt:/opt:ro',
      '-v', '/snap:/snap:ro',
      '-v', '/root:/root:ro',
      '-v', '/sys/fs/bpf:/sys/fs/bpf:rw',
      imageName,
      '-project-name', projectName,
      '-apikey', apiKey,
      '-server-url', serverUrl
    ];

    core.info('Executing Docker container...');

    // Execute the docker command
    const exitCode = await exec.exec('docker', dockerArgs);

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
