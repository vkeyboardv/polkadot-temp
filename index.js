// Import the API
const BN = require('bn.js');
const { ApiPromise, WsProvider } = require('@polkadot/api');

// Our address for Alice on the dev chain
// const ALICE = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';

const removePercentage = (v) => {
  return Number(v.slice(0, -1));
};

async function main () {
  // Construct a provider with the endpoint URL
  const provider = new WsProvider('wss://rpc.polkadot.io/');

  // Create our API with a default connection to the local node
  const api = await ApiPromise.create({ provider });

  await api.isReady;

  // Make our basic chain state/storage queries, all in one go
  const [now, validators, validatorsTotal, validatorCount] = await Promise.all([
    api.query.timestamp.now(),
    api.query.session.validators(),
    api.query.staking.validators.entries(),
    api.query.staking.validatorCount
  ]);

  console.log(`last block timestamp ${now.toNumber()}`);

  const v = [];
  validatorsTotal.forEach(([_args, _prefs]) => {
    const address = _args.args[0].toHuman();
    const prefs = _prefs.toHuman();

    const _commission = removePercentage(prefs.commission);
    // if (_commission !== 100) {
    //   totalNonAllCommission = totalNonAllCommission.add(new BN(_commission));
    // }

    v.push({
      address,
      commission: parseFloat(_commission.toFixed(2)),
      blocked: prefs.blocked,
      grade: "A",
  // "validator": string,
  // * "nominations": integer,
  // "commission": double, // 0.06
  // * "totalStake": double, // in token units in this case DOT
  // * "selfStake": double,
  // * "favorite": boolean, //default false
  // "grade": string // A+ default to A+
  // "address": string // from substrate API
    });
  });

  console.log(v[0])

  const test = await api.query.system.account('14zy72LYvcMiUzsacFSR1xzQsG84Pujby98LvWSVtzSiS3ti')

  console.log(test.toJSON())

  // if (validators && validators.length > 0) {
  //   // Retrieve the balances for all validators
  //   const validatorBalances = await Promise.all(
  //     validators.map((authorityId) =>
  //       api.query.system.account(authorityId)
  //     )
  //   );

  //   console.log(validatorsTotal.length);



  //   // console.log(validators[1][0].args[0].toHuman());
  //   // console.log(validators[1][1].toHuman());

  //   // Print out the authorityIds and balances of all validators

  //   // const _validators = validators.map((authorityId, index) => ({
  //   //   address: authorityId.toString(),
  //   //   balance: validatorBalances[index].data.free.toHuman(),
  //   //   nonce: validatorBalances[index].nonce.toHuman()
  //   // }))

  //   // console.log(validatorCount.toBn())

  //   // const unsub = await api.queryMulti(
  //   //   [
  //   //     api.query.staking.counterForNominators,
  //   //     api.query.staking.counterForValidators,
  //   //     api.query.staking.maxNominatorsCount,
  //   //     api.query.staking.maxValidatorsCount,
  //   //     api.query.staking.validatorCount,
  //   //   ],
  //   //   ([
  //   //     _totalNominators,
  //   //     _totalValidators,
  //   //     _maxNominatorsCount,
  //   //     _maxValidatorsCount,
  //   //     _validatorCount,
  //   //   ]) => {
  //   //     console.log('hello')
  //   //   }
  //   // );

  //   // console.log(validators[0])
  //   // console.log(_validators[0])
  // }
}

main().catch(console.error).finally(() => process.exit());


// * validators.toHuman().length - ACTIVE VALIDATORS KEYS (api.query.session.validators())
