class ApiAccess {
	constructor($http) {
		this.marketOrderURL = 'http://api.eve-central.com/api/quicklook?typeid=34&regionlimit=10000002';
		this.routeJumpURL = 'http://api.eve-central.com/api/route/from/{from}/to/{to}';
		this.$http = $http;
	}
	requestMarketOrders(config, orderData, categoryIndex) {
		//if (categoryIndex < config.categories.length) {
			let x2js = new X2JS();
			let type = DbAccess.getTypeData(34);
			let buyOrders = [];
			let sellOrders = [];
			let orders = [];

			this.$http.get(this.marketOrderURL).then((response) => {
				// parse xml feed to json object
				let body = x2js.xml_str2json(response.body);
				let data = body.evec_api.quicklook;

				// sort buy orders descending and sell orders ascending
				data.buy_orders.order.sort((a, b) => { return parseFloat(b.price) - parseFloat(a.price); });
				data.sell_orders.order.sort((a, b) => { return parseFloat(a.price) - parseFloat(b.price); });

				// set max buy price and min sell price
				let maxBuyPrice = parseFloat(data.buy_orders.order[0].price);
				let minSellPrice = parseFloat(data.sell_orders.order[0].price);

				// get all buy orders with price higher than min sell price
				for (let order of data.buy_orders.order) {
					// filter order from low sec allowed or not
					this.parseNumberFromApi(order);
					if ((!config.avoidLowSec || order.security > 0.5) && order.price > minSellPrice && buyOrders.length < 3) {
						buyOrders.push({
							stationID: order.station,
							stationName: order.station_name,
							systemName: order.station_name.split(' ')[0],
							quantity: order.vol_remain,
							price: order.price
						});
					}
				}

				// get all sell orders with price lower than max buy price
				for (let order of data.sell_orders.order) {
					// filter order from low sec allowed or not
					this.parseNumberFromApi(order);
					if ((!config.avoidLowSec || order.security > 0.5) && order.price < maxBuyPrice && sellOrders.length < 3) {
						sellOrders.push({
							stationID: order.station,
							stationName: order.station_name,
							systemName: order.station_name.split(' ')[0],
							quantity: order.vol_remain,
							price: order.price
						});
					}
				}

				// match sell orders with buy orders
				for (let sellOrder of sellOrders) {
					for (let buyOrder of buyOrders) {
						if (buyOrder.price - sellOrder.price > 0) {
							let minQuantity = Math.min(buyOrder.quantity, sellOrder.quantity);
							let newOrder = {
								name: type.typeName,
								quantity: minQuantity,
								volume: 0,
								sellPrice: sellOrder.price,
								sellQuantity: sellOrder.quantity,
								sellStation: sellOrder.stationName,
								buyPrice: buyOrder.price,
								buyQuantity: buyOrder.quantity,
								buyStation: buyOrder.stationName,
								cost: parseFloat((sellOrder.price * minQuantity).toFixed(2)),
								profit: parseFloat(((buyOrder.price - sellOrder.price) * minQuantity).toFixed(2)),
								profitPercent: 0,
								profitPerM3: 0,
								profitPerJump: 0,
								route: this.getJump(sellOrder.systemName, buyOrder.systemName)
							};
							this.calculateDetailOrder(newOrder, type);
							orderData.push(newOrder);
						}
					}
				}
			}, (response) => {
				// error
				console.log('requestMarketOrders failed');
				console.log(response);
			});
			//setTimeout(this.requestMarketOrders(config, regionIndex, categoryIndex + 1).bind(this), 250);
		//}
	}

	parseNumberFromApi(apiOrder) {
		apiOrder.price = parseFloat(apiOrder.price);
		apiOrder.security = parseFloat(apiOrder.security);
		apiOrder.vol_remain = parseFloat(apiOrder.vol_remain);
	}

	calculateDetailOrder(order, item) {
		order.volume = parseFloat((item.volume * order.quantity).toFixed(2));
		order.profitPercent = parseFloat((order.profit / order.cost).toFixed(2));
		order.profitPerM3 = parseFloat((order.profit / order.volume).toFixed(2));
		order.profitPerJump = parseFloat((order.profit / Math.max(1, order.route)).toFixed(2));
	}

	getJump(from, to) {
		let jump = 0;
		console.log('getJump: ' + from + ' to ' + to);
		if (from != to) {
			console.log('check ' + from + ' to ' + to);
			this.$http.get(this.generateRouteJumpURL(from, to)).then((response) => {
				jump = response.body.length;
				console.log('result: ' + jump);
			}, (response) => {
				// error
				console.log('getJump failed');
				console.log(response);
			});
		}
		console.log('beforeReturn: ' + jump);
		return jump;
	}

	generateRouteJumpURL (from, to) {
		return this.routeJumpURL.replace('{from}', from).replace('{to}', to);
	}

	generateMarketOrderURL (regions, typeID) {
		return this.marketOrderURL + '?regionlimit=' + regions.join('&regionlimit=') + '&typeid=' + typeID;
	}
}