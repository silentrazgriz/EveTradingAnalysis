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

				console.log('buy');
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

				console.log('sell');
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
				console.log('match');
				// match sell orders with buy orders
				for (let sellOrder of sellOrders) {
					for (let buyOrder of buyOrders) {
						if (buyOrder.price - sellOrder.price > 0) {
							let minQuantity = Math.min(buyOrder.quantity, sellOrder.quantity);
							let newOrder = {
								quantity: minQuantity,
								sellOrder: sellOrder,
								buyOrder: buyOrder,
								item: type,
								profit: parseFloat(((buyOrder.price - sellOrder.price) * minQuantity).toFixed(2)),
								cost: parseFloat((sellOrder.price * minQuantity).toFixed(2)),
								route: this.getJump(sellOrder.systemName, buyOrder.systemName),
								volume: 0,
								profitPercent: 0,
								profitPerM3: 0,
								profitPerJump: 0
							};
							this.calculateDetailOrder(newOrder);
							orders.push(newOrder);
						}
					}
				}
				console.log(data);
				console.log(orders);
			}, (response) => {
				// error
				console.log('error');
			});
			//setTimeout(this.requestMarketOrders(config, regionIndex, categoryIndex + 1).bind(this), 250);
		//}
	}

	parseNumberFromApi(apiOrder) {
		apiOrder.price = parseFloat(apiOrder.price);
		apiOrder.security = parseFloat(apiOrder.security);
		apiOrder.vol_remain = parseFloat(apiOrder.vol_remain);
	}

	calculateDetailOrder(order) {
		order.volume = parseFloat((order.item.volume * order.quantity).toFixed(2));
		order.profitPercent = parseFloat((order.profit / order.cost).toFixed(2));
		order.profitPerM3 = parseFloat((order.profit / order.volume).toFixed(2));
		order.profitPerJump = parseFloat((order.profit / Math.max(1, order.route)).toFixed(2));
	}

	getJump(from, to) {
		let jump = 0;
		if (from != to) {
			this.$http.get(this.generateRouteJumpURL(from, to)).then((response) => {
				jump = response.body.length;
			}, (response) => {
				// error
				console.log('error');
			});
		}
		return jump;
	}

	generateRouteJumpURL (from, to) {
		return this.routeJumpURL.replace('{from}', from).replace('{to}', to);
	}

	generateMarketOrderURL (regions, typeID) {
		return this.marketOrderURL + '?regionlimit=' + regions.join('&regionlimit=') + '&typeid=' + typeID;
	}
}