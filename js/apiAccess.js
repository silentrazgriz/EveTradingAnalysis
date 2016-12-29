class ApiAccess {
	constructor($http, orderData) {
		this.marketOrderURL = 'http://api.eve-central.com/api/quicklook';
		this.routeJumpURL = 'http://api.eve-central.com/api/route/from/{from}/to/{to}';
		this.$http = $http;
		this.orderData = orderData;
	}
	requestMarketOrders(config, groupIndex) {
		if (groupIndex < config.groups.length) {
			let x2js = new X2JS();
			let buyOrders = [];
			let sellOrders = [];
			let typeIDs = DbAccess.getTypeIDsFromGroup(config.groups[groupIndex]);

			for (let typeID of typeIDs) {
				let type = DbAccess.getTypeData(typeID);
				let marketOrderURL = this.generateMarketOrderURL(config.regions, typeID);
				this.$http.get(marketOrderURL).then((response) => {
					// parse xml feed to json object
					let body = x2js.xml_str2json(response.body);
					let data = body.evec_api.quicklook;

					if (data.buy_orders.order != undefined && data.sell_orders.order.length != undefined) {
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
										volume: parseFloat((minQuantity * type.volume).toFixed(2)),
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
										route: 0
									};
									this.calculateDetailOrder(newOrder);
									this.getJump(sellOrder.systemName, buyOrder.systemName, this.orderData.length);
									this.orderData.push(newOrder);
								}
							}
						}
					}
				}, (response) => {
					// error
					console.log('requestMarketOrders error: ' + response.body);
				});
			}
			setTimeout(() => { this.requestMarketOrders(config, groupIndex + 1); }, 250);
		}
	}

	parseNumberFromApi(apiOrder) {
		apiOrder.price = parseFloat(apiOrder.price);
		apiOrder.security = parseFloat(apiOrder.security);
		apiOrder.vol_remain = parseFloat(apiOrder.vol_remain);
	}

	calculateDetailOrder(order) {
		order.profitPercent = parseFloat((order.profit / order.cost).toFixed(2));
		order.profitPerM3 = parseFloat((order.profit / order.volume).toFixed(2));
	}

	setProcess(index, length) {

	}

	getJump(from, to, index) {
		if (from != to) {
			this.$http.get(this.generateRouteJumpURL(from, to)).then((response) => {
				this.setJump(response.body.length, index);
			}, (response) => {
				console.log('getJump error: ' + response.body);
			});
		} else {
			this.setJump(0, index);
		}
	}

	setJump(jump, index) {
		this.orderData[index].route = jump;
		this.orderData[index].profitPerJump = parseFloat((this.orderData[index].profit / Math.max(1, jump)).toFixed(2));
	}

	generateRouteJumpURL (from, to) {
		return this.routeJumpURL.replace('{from}', from).replace('{to}', to);
	}

	generateMarketOrderURL (regions, typeID) {
		return this.marketOrderURL + '?regionlimit=' + regions.join('&regionlimit=') + '&typeid=' + typeID;
	}
}