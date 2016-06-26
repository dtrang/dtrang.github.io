var Coin = function (id) {
  this.id = id;
  this.weight = 2;
  this.weighted = false;
};

var CoinHolder = function () {
  this.coins = [];
};

CoinHolder.prototype = {
  get: function (idx) {
    return this.coins[idx];
  },
  set: function (idx, coin) {
    this.coins[idx] = coin;
  },
  size: function () {
    return this.coins.length;
  },
  last: function () {
    return this.coins[this.size() - 1];
  },
  pop: function () {
    return this.coins.pop();
  },
  push: function (coin) {
    this.coins.push(coin);
  }
};

var Basket = function () {
  CoinHolder.call(this);
};

Basket.prototype = Object.create(CoinHolder.prototype);

Basket.prototype.constructor = Basket;

Basket.prototype.reset = function () {
  this.coins.length = 0;
  for (var i = 1; i <= 13; i++) {
    this.coins.push(new Coin(i));
  }
  this.oddCoin = this.coins[chance.integer({min: 0, max: 12})];
  this.oddCoin.weight += [1, -1][chance.integer({min: 0, max: 1})];
  shuffle(this.coins);
};

var Scale = function (elemId) {
  Basket.call(this);
  this.view = $("#" + elemId);
};

Scale.prototype = Object.create(CoinHolder.prototype);

Scale.prototype.constructor = Scale;

Scale.prototype.weigh = function () {
  var total = 0;
  for (var k = 0; k < this.coins.length; k++) {
    this.coins[k].weighted = true;
    total += this.coins[k].weight;
  }
  return total;
};

Scale.prototype.move = function (distance) {
  this.view.animate({
    marginTop: distance + "px"
  }, 500);
};

var BalanceScale = function (leftScaleId, rightScaleId) {
  this.left = new Scale(leftScaleId);
  this.right = new Scale(rightScaleId);
};

BalanceScale.prototype.weigh = function () {
  var lw = this.left.weigh();
  var rw = this.right.weigh();
  var delta = Math.abs(lw - rw);
  if (delta == 0) {
    this.left.move(0);
    this.right.move(0);
  } else {
    var distance = delta / 2 * 25;
    this.left.move((lw < rw ? "-" : "") + distance);
    this.right.move((rw < lw ? "-" : "") + distance);
  }
};

BalanceScale.prototype.getHeavy = function () {
  var lw = this.left.weigh();
  var rw = this.right.weigh();
  if (lw === rw) {
    return null;
  }
  return lw < rw ? this.right : this.left;
};

BalanceScale.prototype.getLight = function () {
  var lw = this.left.weigh();
  var rw = this.right.weigh();
  if (lw === rw) {
    return null;
  }
  return lw < rw ? this.left : this.right;
};

BalanceScale.prototype.reset = function () {
  this.left.coins.length = 0;
  this.right.coins.length = 0;
  this.left.move(0);
  this.right.move(0);
};

function moveNCoins(from, to, n) {
  var counter = 1;
  while (from.coins.length && counter <= n) {
    to.coins.push(from.coins.pop());
    counter++;
  }
}

function moveAllCoins(from, to) {
  while (from.coins.length) {
    to.coins.push(from.coins.pop());
  }
}

function shuffle(array) {
  for (var i = array.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
  return array;
}