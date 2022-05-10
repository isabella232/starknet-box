import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import { Image } from './truffle_docker.mjs';
import { StarkNetDocker } from './starknet_docker.mjs';
import starknetConfig from '../truffle-config.starknet.js';
import { setNetwork, networks } from './networks.mjs';

// Pretty log output
import { Logger } from './logging.mjs';
const logger = new Logger();

// Docker configuration
const compiler_repo = starknetConfig.compilers.cairo.repository;
const compiler_version = starknetConfig.compilers.cairo.version;
const image = new Image(compiler_repo,compiler_version);
const starkNetDocker = new StarkNetDocker(image);

// Project configuration
const projectDir = process.cwd();
const buildDir = starknetConfig.contracts_build_directory;
const accounts_dir = starknetConfig.starknet_accounts_directory;

// Command arguments
const argv = yargs(hideBin(process.argv))
  .parserConfiguration({
    "parse-numbers": false
  })
  .argv;

const txHash = argv.hash;
const networkArg = argv.network;
const contractName = argv.contract;
const getErrorMsg = !!argv.error_message;

// StarkNet network configuration
const network = setNetwork(networkArg);

// Attempt to load the specified docker image
let imageLoaded = false;
try {
  imageLoaded = await starkNetDocker.loadImage(image);
} catch (error) {
  logger.logError(`An error occurred while trying to load the Docker image: ${error.message}`);
}

if (imageLoaded){
  logger.logInfo(`Getting status for transaction: `, `${txHash}`);
  logger.logHeader();

  const commandArguments = [ `--hash`, `${txHash}`];

  if (contractName) {
    commandArguments.push(...[`--contract`, `${buildDir}/${contractName}.json`]);
  }

  if (network === 'devnet') {
    commandArguments.push(...[
      `--gateway_url`,
      networks.devnet.gateway_url,
      `--feeder_gateway_url`,
      networks.devnet.feeder_gateway_url,
      `--no_wallet`
    ]);
  }

  if (getErrorMsg) {
    commandArguments.push(`--error_message`);
  }

  let result;
  try {
      result = await starkNetDocker.getTransactionStatus(
        accounts_dir,
        projectDir,
        network,
        commandArguments
      );
  } catch (error) {
    logger.logError(`An error occurred while attempting to get the transaction status.`);
  }
  if (result[0].StatusCode !== 0) {
    logger.logError(`There was an error while attempting to get the transaction status`);
  }

} else {
  logger.logError('Unable to continue. The docker image could not be located. Requested image: ', image.getRepoTag());
}
