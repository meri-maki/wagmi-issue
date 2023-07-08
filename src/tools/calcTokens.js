const E24 = 1e24;
const E18 = 1e18;

//=======================Functions for precalc=======================
// those functions are not supposed to be run on-chain, instead of it borrow values from
// them and put them as constants
function calcT2(S) {
  return Math.pow((1e-24*S), Math.log2(10))*E18;
}

function calcT(S) {
  if (S < 1e24) {
    return 1e18;
  }

  return calcT2(S);
}

const S_table=[]; // array of token numbers
const T_table=[]; // array of tokens cost

// input manually first segment
S_table.push(0);
T_table.push(E18);
S_table.push(E24);
T_table.push(E18);

// relative distance between nodes
// 1.0005     1.001     1.005     1.01
const grow_factor = 1.01;

// Для 5М токенов:
// при grow_factor=1.01: 161
// при grow_factor=1.005: 322
// при grow_factor=1.001: 1610
// при grow_factor=1.0005: 3219
const table_size = 200;

const BONUS_1_PRICE_THRESHOLD = 10e18;
const BONUS_1_SUPPLY_THRESHOLD = 2e24;

const BONUS_2_PRICE_THRESHOLD = 20e18;
const BONUS_2_SUPPLY_THRESHOLD = 2464047377378012230000000;

for (let i = 1; i < table_size; i++) {
  const currentSupply = S_table[S_table.length - 1];
  const nextSupply = (currentSupply*grow_factor);
  const nextPrice = calcT2(nextSupply);

  if (BONUS_1_SUPPLY_THRESHOLD > currentSupply && BONUS_1_SUPPLY_THRESHOLD < nextSupply) {
    S_table.push(BONUS_1_SUPPLY_THRESHOLD);
    T_table.push(BONUS_1_PRICE_THRESHOLD);
  }

  if (BONUS_2_SUPPLY_THRESHOLD > currentSupply && BONUS_2_SUPPLY_THRESHOLD < nextSupply) {
    S_table.push(BONUS_2_SUPPLY_THRESHOLD);
    T_table.push(BONUS_2_PRICE_THRESHOLD);
  }

  S_table.push(nextSupply);
  T_table.push(parseInt(calcT2(nextSupply)));
}

function calcTCurr(S_prev, S_curr, S_next, T_prev, T_next, adjustment = 0) {
  return (S_curr+adjustment-S_prev)*(T_next-T_prev)/(S_next-S_prev)+T_prev;
}

// S is no longer input argument, it should be stored in protocol
function calcV2(usdAmount, supply, calcBonus1 = false, calcBonus2 = false) {
  let nodeId = getNodeId(supply);

  // bought currently
  let tokensAmount = 0;
  let bonus1Amount = 0;
  let bonus2Amount = 0;

  let S_curr = supply;
  let S_prev = null;
  let S_next = null;
  let T_prev = null;
  let T_next = null;

  while(true) {
    // current S
    S_prev = S_table[nodeId];
    S_next = S_table[nodeId+1];

    T_prev = T_table[nodeId];
    T_next = T_table[nodeId+1];

    // calculate curent price for token based on linear approximation
    const T_curr = calcTCurr(S_prev, S_curr, S_next, T_prev, T_next);

    let tokensByIter = 0;
    let T_price = 0;

    if (S_next-S_curr > usdAmount*2E18/(T_next+T_curr)) { // buy less than for next node
      // adjust price
      const T_curr2 = calcTCurr(S_prev, S_curr, S_next, T_prev, T_next, (usdAmount*E18/(T_next+T_curr)));
      T_price = (T_curr+T_curr2)*0.5;
      tokensByIter = usdAmount*E18/T_curr2;

      tokensAmount+=tokensByIter
      S_curr+=tokensByIter;
      usdAmount=0;
    } else {
      tokensByIter=S_next-S_curr
      // adjust price
      T_price=(T_curr+T_next)*0.5;

      // buy all tokens those can be bought within iteration
      tokensAmount+=tokensByIter;
      S_curr=S_next;
      usdAmount-=tokensByIter*T_price/E18
      nodeId=nodeId+1; // go to next step
    }

    if (calcBonus1 && T_curr >= BONUS_1_PRICE_THRESHOLD) {
      bonus1Amount += tokensByIter / 10;
      S_curr += tokensByIter / 10;
    }

    if (calcBonus2 && T_curr >= BONUS_2_PRICE_THRESHOLD) {
      bonus2Amount += tokensByIter / 10;
      S_curr += tokensByIter / 10;
    }

    nodeId = getNodeId(S_curr);

    if (usdAmount == 0) {
      break;
    }
  }

  const currentPricePerToken = calcTCurr(S_prev, S_curr, S_next, T_prev, T_next);

  return {S_curr, currentPricePerToken, nodeId, tokensAmount, bonus1Amount, bonus2Amount};
}

function getNodeId(supply) {
  for (let j = 0; j < table_size; j++) {
    if (supply >= S_table[j] && supply < S_table[j+1]) {
      return j;
    }
  }
}

function toFixed(x) {
  let result = '';
  const xStr = x.toString(10);
  const digitCount = xStr.indexOf('e') === -1 ? xStr.length : (parseInt(xStr.substr(xStr.indexOf('e') + 1)) + 1);

  for (let i = 1; i <= digitCount; i++) {
    const mod = (x % Math.pow(10, i)).toString(10);
    const exponent = (mod.indexOf('e') === -1) ? 0 : parseInt(mod.substr(mod.indexOf('e')+1));
    if ((exponent === 0 && mod.length !== i) || (exponent > 0 && exponent !== i-1)) {
      result = '0' + result;
    }
    else {
      result = mod.charAt(0) + result;
    }
  }
  return result;
}

// function calc(usdAmount, totalSupply, calcBonus1, calcBonus2) {
//   const result = calcV2(usdAmount * E18, totalSupply, calcBonus1, calcBonus2);
//
//   return {
//     "nodeId": result.nodeId,
//     "tokensAmount": toFixed(result.tokensAmount),
//     "bonus1Amount": toFixed(result.bonus1Amount),
//     "bonus2Amount": toFixed(result.bonus2Amount),
//     "currentPricePerToken": toFixed(result.currentPricePerToken),
//     "refTokenPrice": toFixed(calcT(result.S_curr)),
//   }
// }

function calc(usdAmount, totalSupply, calcBonus1, calcBonus2) {
  return fetch("https://pk6pbrafnmiee2kvwirocuwdru0lhcwz.lambda-url.us-east-1.on.aws/", {
    method: "post",
    mode: "cors",
    body: JSON.stringify({usdAmount, "supply": totalSupply})
  }).then(function(response) {
    return response.json();
  });
}



export default {
  calc,
}

// const ethAmount = 10;
// const ethPrice = 119452799054 // price.json => ethPrice
// const usdAmount = (ethAmount * ethPrice) / Math.pow(10, 8);
// const totalSupply = 1117842059828883125453548;  // price.json => totalSupply
// const calcBonus1 = false;
// const calcBonus2 = false;
//
// console.log( calcTokens.calc(usdAmount, totalSupply, calcBonus1, calcBonus2) );
/*{
  'nodeId': 12,
  'tokensAmount': '8150712415022131183616',
  'bonus1Amount': '0',
  'bonus2Amount': '0',
  'currentPricePerToken': '1483231280105969408',
  'refTokenPrice': '1483192657272407808'
}*/

// const results = [{"nodeId": 0, "tokensAmount": "5000000000000000000000", "bonus1Amount": "0", "bonus2Amount": "0", "currentPricePerToken": "1000000000000000000", "refTokenPrice": "1000000000000000000"}, {"nodeId": 0, "tokensAmount": "5000000000000000000000", "bonus1Amount": "0", "bonus2Amount": "0", "currentPricePerToken": "1000000000000000000", "refTokenPrice": "1000000000000000000"}, {"nodeId": 0, "tokensAmount": "5000000000000000000000", "bonus1Amount": "0", "bonus2Amount": "0", "currentPricePerToken": "1000000000000000000", "refTokenPrice": "1000000000000000000"}, {"nodeId": 0, "tokensAmount": "5000000000000000000000", "bonus1Amount": "0", "bonus2Amount": "0", "currentPricePerToken": "1000000000000000000", "refTokenPrice": "1000000000000000000"}, {"nodeId": 0, "tokensAmount": "10000000000000000000000", "bonus1Amount": "0", "bonus2Amount": "0", "currentPricePerToken": "1000000000000000000", "refTokenPrice": "1000000000000000000"}, {"nodeId": 0, "tokensAmount": "10000000000000000000000", "bonus1Amount": "0", "bonus2Amount": "0", "currentPricePerToken": "1000000000000000000", "refTokenPrice": "1000000000000000000"}, {"nodeId": 0, "tokensAmount": "10000000000000000000000", "bonus1Amount": "0", "bonus2Amount": "0", "currentPricePerToken": "1000000000000000000", "refTokenPrice": "1000000000000000000"}, {"nodeId": 0, "tokensAmount": "10000000000000000000000", "bonus1Amount": "0", "bonus2Amount": "0", "currentPricePerToken": "1000000000000000000", "refTokenPrice": "1000000000000000000"}, {"nodeId": 0, "tokensAmount": "20000000000000000000000", "bonus1Amount": "0", "bonus2Amount": "0", "currentPricePerToken": "1000000000000000000", "refTokenPrice": "1000000000000000000"}, {"nodeId": 0, "tokensAmount": "20000000000000000000000", "bonus1Amount": "0", "bonus2Amount": "0", "currentPricePerToken": "1000000000000000000", "refTokenPrice": "1000000000000000000"}, {"nodeId": 0, "tokensAmount": "20000000000000000000000", "bonus1Amount": "0", "bonus2Amount": "0", "currentPricePerToken": "1000000000000000000", "refTokenPrice": "1000000000000000000"}, {"nodeId": 0, "tokensAmount": "20000000000000000000000", "bonus1Amount": "0", "bonus2Amount": "0", "currentPricePerToken": "1000000000000000000", "refTokenPrice": "1000000000000000000"}, {"nodeId": 0, "tokensAmount": "50000000000000004194304", "bonus1Amount": "0", "bonus2Amount": "0", "currentPricePerToken": "1000000000000000000", "refTokenPrice": "1000000000000000000"}, {"nodeId": 0, "tokensAmount": "50000000000000004194304", "bonus1Amount": "0", "bonus2Amount": "0", "currentPricePerToken": "1000000000000000000", "refTokenPrice": "1000000000000000000"}, {"nodeId": 0, "tokensAmount": "50000000000000004194304", "bonus1Amount": "0", "bonus2Amount": "0", "currentPricePerToken": "1000000000000000000", "refTokenPrice": "1000000000000000000"}, {"nodeId": 0, "tokensAmount": "50000000000000004194304", "bonus1Amount": "0", "bonus2Amount": "0", "currentPricePerToken": "1000000000000000000", "refTokenPrice": "1000000000000000000"}, {"nodeId": 0, "tokensAmount": "100000000000000008388608", "bonus1Amount": "0", "bonus2Amount": "0", "currentPricePerToken": "1000000000000000000", "refTokenPrice": "1000000000000000000"}, {"nodeId": 0, "tokensAmount": "100000000000000008388608", "bonus1Amount": "0", "bonus2Amount": "0", "currentPricePerToken": "1000000000000000000", "refTokenPrice": "1000000000000000000"}, {"nodeId": 0, "tokensAmount": "100000000000000008388608", "bonus1Amount": "0", "bonus2Amount": "0", "currentPricePerToken": "1000000000000000000", "refTokenPrice": "1000000000000000000"}, {"nodeId": 0, "tokensAmount": "100000000000000008388608", "bonus1Amount": "0", "bonus2Amount": "0", "currentPricePerToken": "1000000000000000000", "refTokenPrice": "1000000000000000000"}, {"nodeId": 0, "tokensAmount": "200000000000000016777216", "bonus1Amount": "0", "bonus2Amount": "0", "currentPricePerToken": "1000000000000000000", "refTokenPrice": "1000000000000000000"}, {"nodeId": 0, "tokensAmount": "200000000000000016777216", "bonus1Amount": "0", "bonus2Amount": "0", "currentPricePerToken": "1000000000000000000", "refTokenPrice": "1000000000000000000"}, {"nodeId": 0, "tokensAmount": "200000000000000016777216", "bonus1Amount": "0", "bonus2Amount": "0", "currentPricePerToken": "1000000000000000000", "refTokenPrice": "1000000000000000000"}, {"nodeId": 0, "tokensAmount": "200000000000000016777216", "bonus1Amount": "0", "bonus2Amount": "0", "currentPricePerToken": "1000000000000000000", "refTokenPrice": "1000000000000000000"}, {"nodeId": 0, "tokensAmount": "499999999999999991611392", "bonus1Amount": "0", "bonus2Amount": "0", "currentPricePerToken": "1000000000000000000", "refTokenPrice": "1000000000000000000"}, {"nodeId": 0, "tokensAmount": "499999999999999991611392", "bonus1Amount": "0", "bonus2Amount": "0", "currentPricePerToken": "1000000000000000000", "refTokenPrice": "1000000000000000000"}, {"nodeId": 0, "tokensAmount": "499999999999999991611392", "bonus1Amount": "0", "bonus2Amount": "0", "currentPricePerToken": "1000000000000000000", "refTokenPrice": "1000000000000000000"}, {"nodeId": 0, "tokensAmount": "499999999999999991611392", "bonus1Amount": "0", "bonus2Amount": "0", "currentPricePerToken": "1000000000000000000", "refTokenPrice": "1000000000000000000"}, {"nodeId": 1, "tokensAmount": "999999999999999983222784", "bonus1Amount": "0", "bonus2Amount": "0", "currentPricePerToken": "1000000000000000000", "refTokenPrice": "999999999999999616"}, {"nodeId": 1, "tokensAmount": "999999999999999983222784", "bonus1Amount": "0", "bonus2Amount": "0", "currentPricePerToken": "1000000000000000000", "refTokenPrice": "999999999999999616"}, {"nodeId": 1, "tokensAmount": "999999999999999983222784", "bonus1Amount": "0", "bonus2Amount": "0", "currentPricePerToken": "1000000000000000000", "refTokenPrice": "999999999999999616"}, {"nodeId": 1, "tokensAmount": "999999999999999983222784", "bonus1Amount": "0", "bonus2Amount": "0", "currentPricePerToken": "1000000000000000000", "refTokenPrice": "999999999999999616"}, {"nodeId": 1, "tokensAmount": "4959024480298349887488", "bonus1Amount": "0", "bonus2Amount": "0", "currentPricePerToken": "1016665617834627840", "refTokenPrice": "1016568572246646016"}, {"nodeId": 1, "tokensAmount": "4959024480298349887488", "bonus1Amount": "0", "bonus2Amount": "0", "currentPricePerToken": "1016665617834627840", "refTokenPrice": "1016568572246646016"}, {"nodeId": 1, "tokensAmount": "4959024480298349887488", "bonus1Amount": "0", "bonus2Amount": "0", "currentPricePerToken": "1016665617834627840", "refTokenPrice": "1016568572246646016"}, {"nodeId": 1, "tokensAmount": "4959024480298349887488", "bonus1Amount": "0", "bonus2Amount": "0", "currentPricePerToken": "1016665617834627840", "refTokenPrice": "1016568572246646016"}, {"nodeId": 1, "tokensAmount": "9837430197621455060992", "bonus1Amount": "0", "bonus2Amount": "0", "currentPricePerToken": "1033060303049466624", "refTokenPrice": "1033054081267246464"}, {"nodeId": 1, "tokensAmount": "9837430197621455060992", "bonus1Amount": "0", "bonus2Amount": "0", "currentPricePerToken": "1033060303049466624", "refTokenPrice": "1033054081267246464"}, {"nodeId": 1, "tokensAmount": "9837430197621455060992", "bonus1Amount": "0", "bonus2Amount": "0", "currentPricePerToken": "1033060303049466624", "refTokenPrice": "1033054081267246464"}, {"nodeId": 1, "tokensAmount": "9837430197621455060992", "bonus1Amount": "0", "bonus2Amount": "0", "currentPricePerToken": "1033060303049466624", "refTokenPrice": "1033054081267246464"}, {"nodeId": 2, "tokensAmount": "19366509987306051469312", "bonus1Amount": "0", "bonus2Amount": "0", "currentPricePerToken": "1065820069420237696", "refTokenPrice": "1065792994285849984"}, {"nodeId": 2, "tokensAmount": "19366509987306051469312", "bonus1Amount": "0", "bonus2Amount": "0", "currentPricePerToken": "1065820069420237696", "refTokenPrice": "1065792994285849984"}, {"nodeId": 2, "tokensAmount": "19366509987306051469312", "bonus1Amount": "0", "bonus2Amount": "0", "currentPricePerToken": "1065820069420237696", "refTokenPrice": "1065792994285849984"}, {"nodeId": 2, "tokensAmount": "19366509987306051469312", "bonus1Amount": "0", "bonus2Amount": "0", "currentPricePerToken": "1065820069420237696", "refTokenPrice": "1065792994285849984"}, {"nodeId": 5, "tokensAmount": "46306112819159824859136", "bonus1Amount": "0", "bonus2Amount": "0", "currentPricePerToken": "1162374337872036096", "refTokenPrice": "1162264561006767360"}, {"nodeId": 5, "tokensAmount": "46306112819159824859136", "bonus1Amount": "0", "bonus2Amount": "0", "currentPricePerToken": "1162374337872036096", "refTokenPrice": "1162264561006767360"}, {"nodeId": 5, "tokensAmount": "46306112819159824859136", "bonus1Amount": "0", "bonus2Amount": "0", "currentPricePerToken": "1162374337872036096", "refTokenPrice": "1162264561006767360"}, {"nodeId": 5, "tokensAmount": "46306112819159824859136", "bonus1Amount": "0", "bonus2Amount": "0", "currentPricePerToken": "1162374337872036096", "refTokenPrice": "1162264561006767360"}, {"nodeId": 9, "tokensAmount": "86659621211773736058880", "bonus1Amount": "0", "bonus2Amount": "0", "currentPricePerToken": "1318068724955793152", "refTokenPrice": "1317953567252233216"}, {"nodeId": 9, "tokensAmount": "86659621211773736058880", "bonus1Amount": "0", "bonus2Amount": "0", "currentPricePerToken": "1318068724955793152", "refTokenPrice": "1317953567252233216"}, {"nodeId": 9, "tokensAmount": "86659621211773736058880", "bonus1Amount": "0", "bonus2Amount": "0", "currentPricePerToken": "1318068724955793152", "refTokenPrice": "1317953567252233216"}, {"nodeId": 9, "tokensAmount": "86659621211773736058880", "bonus1Amount": "0", "bonus2Amount": "0", "currentPricePerToken": "1318068724955793152", "refTokenPrice": "1317953567252233216"}, {"nodeId": 15, "tokensAmount": "155029981383303687569408", "bonus1Amount": "0", "bonus2Amount": "0", "currentPricePerToken": "1614253473568548352", "refTokenPrice": "1614099490776893696"}, {"nodeId": 15, "tokensAmount": "155029981383303687569408", "bonus1Amount": "0", "bonus2Amount": "0", "currentPricePerToken": "1614253473568548352", "refTokenPrice": "1614099490776893696"}, {"nodeId": 15, "tokensAmount": "155029981383303687569408", "bonus1Amount": "0", "bonus2Amount": "0", "currentPricePerToken": "1614253473568548352", "refTokenPrice": "1614099490776893696"}, {"nodeId": 15, "tokensAmount": "155029981383303687569408", "bonus1Amount": "0", "bonus2Amount": "0", "currentPricePerToken": "1614253473568548352", "refTokenPrice": "1614099490776893696"}, {"nodeId": 27, "tokensAmount": "305097992615477089665024", "bonus1Amount": "0", "bonus2Amount": "0", "currentPricePerToken": "2422078262263540736", "refTokenPrice": "2421910749975244800"}, {"nodeId": 27, "tokensAmount": "305097992615477089665024", "bonus1Amount": "0", "bonus2Amount": "0", "currentPricePerToken": "2422078262263540736", "refTokenPrice": "2421910749975244800"}, {"nodeId": 27, "tokensAmount": "305097992615477089665024", "bonus1Amount": "0", "bonus2Amount": "0", "currentPricePerToken": "2422078262263540736", "refTokenPrice": "2421910749975244800"}, {"nodeId": 27, "tokensAmount": "305097992615477089665024", "bonus1Amount": "0", "bonus2Amount": "0", "currentPricePerToken": "2422078262263540736", "refTokenPrice": "2421910749975244800"}, {"nodeId": 39, "tokensAmount": "472283504138177463975936", "bonus1Amount": "0", "bonus2Amount": "0", "currentPricePerToken": "3614710925517861888", "refTokenPrice": "3614560553279346176"}, {"nodeId": 39, "tokensAmount": "472283504138177463975936", "bonus1Amount": "0", "bonus2Amount": "0", "currentPricePerToken": "3614710925517861888", "refTokenPrice": "3614560553279346176"}, {"nodeId": 39, "tokensAmount": "472283504138177463975936", "bonus1Amount": "0", "bonus2Amount": "0", "currentPricePerToken": "3614710925517861888", "refTokenPrice": "3614560553279346176"}, {"nodeId": 39, "tokensAmount": "472283504138177463975936", "bonus1Amount": "0", "bonus2Amount": "0", "currentPricePerToken": "3614710925517861888", "refTokenPrice": "3614560553279346176"}, {"nodeId": 71, "tokensAmount": "499792817814983802880", "bonus1Amount": "0", "bonus2Amount": "0", "currentPricePerToken": "10008334018921986048", "refTokenPrice": "10008303787683096576"}, {"nodeId": 71, "tokensAmount": "499792817814983802880", "bonus1Amount": "49979281781498380288", "bonus2Amount": "0", "currentPricePerToken": "10009167420814186496", "refTokenPrice": "10009134431436914688"}, {"nodeId": 71, "tokensAmount": "499792817814983802880", "bonus1Amount": "0", "bonus2Amount": "0", "currentPricePerToken": "10008334018921986048", "refTokenPrice": "10008303787683096576"}, {"nodeId": 71, "tokensAmount": "499792817814983802880", "bonus1Amount": "49979281781498380288", "bonus2Amount": "0", "currentPricePerToken": "10009167420814186496", "refTokenPrice": "10009134431436914688"}, {"nodeId": 71, "tokensAmount": "999171614513365909504", "bonus1Amount": "0", "bonus2Amount": "0", "currentPricePerToken": "10016661134063652864", "refTokenPrice": "10016605509038798848"}, {"nodeId": 71, "tokensAmount": "999171614513365909504", "bonus1Amount": "99917161451336597504", "bonus2Amount": "0", "currentPricePerToken": "10018327247470018560", "refTokenPrice": "10018267119251546112"}, {"nodeId": 71, "tokensAmount": "999171614513365909504", "bonus1Amount": "0", "bonus2Amount": "0", "currentPricePerToken": "10016661134063652864", "refTokenPrice": "10016605509038798848"}, {"nodeId": 71, "tokensAmount": "999171614513365909504", "bonus1Amount": "99917161451336597504", "bonus2Amount": "0", "currentPricePerToken": "10018327247470018560", "refTokenPrice": "10018267119251546112"}, {"nodeId": 71, "tokensAmount": "1996689200671575769088", "bonus1Amount": "0", "bonus2Amount": "0", "currentPricePerToken": "10033294687291568128", "refTokenPrice": "10033202745484410880"}, {"nodeId": 71, "tokensAmount": "1996689200671575769088", "bonus1Amount": "199668920067157590016", "bonus2Amount": "0", "currentPricePerToken": "10036624156020727808", "refTokenPrice": "10036527252208705536"}, {"nodeId": 71, "tokensAmount": "1996689200671575769088", "bonus1Amount": "0", "bonus2Amount": "0", "currentPricePerToken": "10033294687291568128", "refTokenPrice": "10033202745484410880"}, {"nodeId": 71, "tokensAmount": "1996689200671575769088", "bonus1Amount": "199668920067157590016", "bonus2Amount": "0", "currentPricePerToken": "10036624156020727808", "refTokenPrice": "10036527252208705536"}, {"nodeId": 71, "tokensAmount": "4979358758453836251136", "bonus1Amount": "0", "bonus2Amount": "0", "currentPricePerToken": "10083030545124149248", "refTokenPrice": "10082944674985267200"}, {"nodeId": 71, "tokensAmount": "4979358758453836251136", "bonus1Amount": "497935875845383651328", "bonus2Amount": "0", "currentPricePerToken": "10091333599636563968", "refTokenPrice": "10091265499013697536"}, {"nodeId": 71, "tokensAmount": "4979358758453836251136", "bonus1Amount": "0", "bonus2Amount": "0", "currentPricePerToken": "10083030545124149248", "refTokenPrice": "10082944674985267200"}, {"nodeId": 71, "tokensAmount": "4979358758453836251136", "bonus1Amount": "497935875845383651328", "bonus2Amount": "0", "currentPricePerToken": "10091333599636563968", "refTokenPrice": "10091265499013697536"}, {"nodeId": 72, "tokensAmount": "9917975407604346650624", "bonus1Amount": "0", "bonus2Amount": "0", "currentPricePerToken": "10166203841851232256", "refTokenPrice": "10165684486664493056"}, {"nodeId": 72, "tokensAmount": "9914420227280864280576", "bonus1Amount": "991442022728086323200", "bonus2Amount": "0", "currentPricePerToken": "10182934256749498368", "refTokenPrice": "10182291958374526976"}, {"nodeId": 72, "tokensAmount": "9917975407604346650624", "bonus1Amount": "0", "bonus2Amount": "0", "currentPricePerToken": "10166203841851232256", "refTokenPrice": "10165684486664493056"}, {"nodeId": 72, "tokensAmount": "9914420227280864280576", "bonus1Amount": "991442022728086323200", "bonus2Amount": "0", "currentPricePerToken": "10182934256749498368", "refTokenPrice": "10182291958374526976"}, {"nodeId": 72, "tokensAmount": "19675890698041159581696", "bonus1Amount": "0", "bonus2Amount": "0", "currentPricePerToken": "10331459582026657792", "refTokenPrice": "10330558319077101568"}, {"nodeId": 72, "tokensAmount": "19661513426799014445056", "bonus1Amount": "1966151342679901339648", "bonus2Amount": "0", "currentPricePerToken": "10364513964979408896", "refTokenPrice": "10363759158759319552"}, {"nodeId": 72, "tokensAmount": "19675890698041159581696", "bonus1Amount": "0", "bonus2Amount": "0", "currentPricePerToken": "10331459582026657792", "refTokenPrice": "10330558319077101568"}, {"nodeId": 72, "tokensAmount": "19661513426799014445056", "bonus1Amount": "1966151342679901339648", "bonus2Amount": "0", "currentPricePerToken": "10364513964979408896", "refTokenPrice": "10363759158759319552"}, {"nodeId": 74, "tokensAmount": "48044375057230129528832", "bonus1Amount": "0", "bonus2Amount": "0", "currentPricePerToken": "10820675485874597888", "refTokenPrice": "10820491161071253504"}, {"nodeId": 74, "tokensAmount": "47922225282025009446912", "bonus1Amount": "4792222528202500734976", "bonus2Amount": "0", "currentPricePerToken": "10903506121629880320", "refTokenPrice": "10902672048565334016"}, {"nodeId": 74, "tokensAmount": "48044375057230129528832", "bonus1Amount": "0", "bonus2Amount": "0", "currentPricePerToken": "10820675485874597888", "refTokenPrice": "10820491161071253504"}, {"nodeId": 74, "tokensAmount": "47922225282025009446912", "bonus1Amount": "4792222528202500734976", "bonus2Amount": "0", "currentPricePerToken": "10903506121629880320", "refTokenPrice": "10902672048565334016"}, {"nodeId": 76, "tokensAmount": "92612139617065562537984", "bonus1Amount": "0", "bonus2Amount": "0", "currentPricePerToken": "11623384066443718656", "refTokenPrice": "11622644022938724352"}, {"nodeId": 76, "tokensAmount": "92078136545754977665024", "bonus1Amount": "9207813654575497347072", "bonus2Amount": "0", "currentPricePerToken": "11784502459130179584", "refTokenPrice": "11783451056085798912"}, {"nodeId": 76, "tokensAmount": "92612139617065562537984", "bonus1Amount": "0", "bonus2Amount": "0", "currentPricePerToken": "11623384066443718656", "refTokenPrice": "11622644022938724352"}, {"nodeId": 76, "tokensAmount": "92078136545754977665024", "bonus1Amount": "9207813654575497347072", "bonus2Amount": "0", "currentPricePerToken": "11784502459130179584", "refTokenPrice": "11783451056085798912"}, {"nodeId": 113, "tokensAmount": "129997893471206064128", "bonus1Amount": "0", "bonus2Amount": "0", "currentPricePerToken": "38464962163374383104", "refTokenPrice": "38461393497218555904"}, {"nodeId": 113, "tokensAmount": "129997893471206064128", "bonus1Amount": "12999789347120607232", "bonus2Amount": "0", "currentPricePerToken": "38465516907347615744", "refTokenPrice": "38461947119638044672"}, {"nodeId": 113, "tokensAmount": "129997893471206064128", "bonus1Amount": "0", "bonus2Amount": "12999789347120607232", "currentPricePerToken": "38465516907347615744", "refTokenPrice": "38461947119638044672"}, {"nodeId": 113, "tokensAmount": "129997893471206064128", "bonus1Amount": "12999789347120607232", "bonus2Amount": "12999789347120607232", "currentPricePerToken": "38466071651320848384", "refTokenPrice": "38462500747627585536"}, {"nodeId": 113, "tokensAmount": "259977219276284461056", "bonus1Amount": "0", "bonus2Amount": "0", "currentPricePerToken": "38470508810763165696", "refTokenPrice": "38466929181252362240"}, {"nodeId": 113, "tokensAmount": "259977219276284461056", "bonus1Amount": "25997721927628447744", "bonus2Amount": "0", "currentPricePerToken": "38471618219475296256", "refTokenPrice": "38468036463966355456"}, {"nodeId": 113, "tokensAmount": "259977219276284461056", "bonus1Amount": "0", "bonus2Amount": "25997721927628447744", "currentPricePerToken": "38471618219475296256", "refTokenPrice": "38468036463966355456"}, {"nodeId": 113, "tokensAmount": "259977219276284461056", "bonus1Amount": "25997721927628447744", "bonus2Amount": "25997721927628447744", "currentPricePerToken": "38472727628187426816", "refTokenPrice": "38469143768958795776"}, {"nodeId": 113, "tokensAmount": "519880183797962178560", "bonus1Amount": "0", "bonus2Amount": "0", "currentPricePerToken": "38481599729188585472", "refTokenPrice": "38477999847723696128"}, {"nodeId": 113, "tokensAmount": "519880183797962178560", "bonus1Amount": "51988018379796217856", "bonus2Amount": "0", "currentPricePerToken": "38483818229743239168", "refTokenPrice": "38480214564561133568"}, {"nodeId": 113, "tokensAmount": "519880183797962178560", "bonus1Amount": "0", "bonus2Amount": "51988018379796217856", "currentPricePerToken": "38483818229743239168", "refTokenPrice": "38480214564561133568"}, {"nodeId": 113, "tokensAmount": "519880183797962178560", "bonus1Amount": "51988018379796217856", "bonus2Amount": "51988018379796217856", "currentPricePerToken": "38486036730297892864", "refTokenPrice": "38482429370497998848"}, {"nodeId": 113, "tokensAmount": "1299143866829023215616", "bonus1Amount": "0", "bonus2Amount": "0", "currentPricePerToken": "38514853485860003840", "refTokenPrice": "38511206231686209536"}, {"nodeId": 113, "tokensAmount": "1299143866829023215616", "bonus1Amount": "129914386682902315008", "bonus2Amount": "0", "currentPricePerToken": "38520397362081808384", "refTokenPrice": "38516744157543292928"}, {"nodeId": 113, "tokensAmount": "1299143866829023215616", "bonus1Amount": "0", "bonus2Amount": "129914386682902315008", "currentPricePerToken": "38520397362081808384", "refTokenPrice": "38516744157543292928"}, {"nodeId": 113, "tokensAmount": "1299143866829023215616", "bonus1Amount": "129914386682902315008", "bonus2Amount": "129914386682902315008", "currentPricePerToken": "38525941238303604736", "refTokenPrice": "38522282640005120000"}, {"nodeId": 113, "tokensAmount": "2596434542007915380736", "bonus1Amount": "0", "bonus2Amount": "0", "currentPricePerToken": "38570213166265925632", "refTokenPrice": "38566531468970115072"}, {"nodeId": 113, "tokensAmount": "2596434542007915380736", "bonus1Amount": "259643454200791531520", "bonus2Amount": "0", "currentPricePerToken": "38581293010528329728", "refTokenPrice": "38577611087865069568"}, {"nodeId": 113, "tokensAmount": "2596434542007915380736", "bonus1Amount": "0", "bonus2Amount": "259643454200791531520", "currentPricePerToken": "38581293010528329728", "refTokenPrice": "38577611087865069568"}, {"nodeId": 113, "tokensAmount": "2596434542007915380736", "bonus1Amount": "259643454200791531520", "bonus2Amount": "259643454200791531520", "currentPricePerToken": "38592372854790725632", "refTokenPrice": "38588692931401596928"}, {"nodeId": 113, "tokensAmount": "5185472155972060315648", "bonus1Amount": "0", "bonus2Amount": "0", "currentPricePerToken": "38680695957524832256", "refTokenPrice": "38677111550887231488"}, {"nodeId": 113, "tokensAmount": "5185472155972060315648", "bonus1Amount": "518547215597206044672", "bonus2Amount": "0", "currentPricePerToken": "38702824080913113088", "refTokenPrice": "38699285767448412160"}, {"nodeId": 113, "tokensAmount": "5185472155972060315648", "bonus1Amount": "0", "bonus2Amount": "518547215597206044672", "currentPricePerToken": "38702824080913113088", "refTokenPrice": "38699285767448412160"}, {"nodeId": 113, "tokensAmount": "5185472155972060315648", "bonus1Amount": "518547215597206044672", "bonus2Amount": "518547215597206044672", "currentPricePerToken": "38724952204301393920", "refTokenPrice": "38721468868369317888"}, {"nodeId": 113, "tokensAmount": "12908518178881095598080", "bonus1Amount": "0", "bonus2Amount": "0", "currentPricePerToken": "39010263854503190528", "refTokenPrice": "39008286047329976320"}, {"nodeId": 113, "tokensAmount": "12908518178881095598080", "bonus1Amount": "1290851817888109559808", "bonus2Amount": "0", "currentPricePerToken": "39065348767589302272", "refTokenPrice": "39063832144372572160"}, {"nodeId": 113, "tokensAmount": "12908518178881095598080", "bonus1Amount": "0", "bonus2Amount": "1290851817888109559808", "currentPricePerToken": "39065348767589302272", "refTokenPrice": "39063832144372572160"}, {"nodeId": 113, "tokensAmount": "12908518178881095598080", "bonus1Amount": "1290851817888109559808", "bonus2Amount": "1290851817888109559808", "currentPricePerToken": "39120433680675422208", "refTokenPrice": "39119433502915813376"}, {"nodeId": 114, "tokensAmount": "25636434920502489776128", "bonus1Amount": "0", "bonus2Amount": "0", "currentPricePerToken": "39561346684437307392", "refTokenPrice": "39558393073902215168"}, {"nodeId": 114, "tokensAmount": "25620896139750924091392", "bonus1Amount": "2562089613975092199424", "bonus2Amount": "0", "currentPricePerToken": "39672556353103978496", "refTokenPrice": "39669103568726089728"}, {"nodeId": 114, "tokensAmount": "25620896139750924091392", "bonus1Amount": "0", "bonus2Amount": "2562089613975092199424", "currentPricePerToken": "39672556353103978496", "refTokenPrice": "39669103568726089728"}, {"nodeId": 114, "tokensAmount": "25605417833637846450176", "bonus1Amount": "2560541783363784540160", "bonus2Amount": "2560541783363784540160", "currentPricePerToken": "39783633473034543104", "refTokenPrice": "39779898110312529920"}];
//
// // test
// function test() {
//   const supplies = [0, 1e6, 2e6, 3e6];
//   const usdAmounts = [5000, 10000, 20000, 50000, 100000, 200000, 500000, 1000000];
//   const bonuses = [[false, false], [true, false], [false, true], [true, true]];
//
//   let i = 0;
//
//   supplies.forEach((supply) => {
//     usdAmounts.forEach((usdAmount) => {
//       bonuses.forEach(([calcBonus1, calcBonus2]) => {
//         const result = calc(usdAmount, supply * E18, calcBonus1, calcBonus2);
//         //if (JSON.stringify(result) !== JSON.stringify(results[i])) {
//         if (result.tokensAmount !== results[i].tokensAmount) {
//           console.log("in:", {usdAmount, supply, calcBonus1, calcBonus2});
//           console.log("out:", result);
//           console.log("correct result:", results[i]);
//         } else {
//           console.log("test successful");
//         }
//
//         i++;
//       });
//     });
//   });
// }
