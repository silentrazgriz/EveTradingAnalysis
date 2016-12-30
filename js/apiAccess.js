class ApiAccess {
	constructor($http, vueApp) {
		this.marketOrderURL = 'http://api.eve-central.com/api/quicklook';
		this.routeJumpURL = 'http://api.eve-central.com/api/route/from/{from}/to/{to}';
		this.$http = $http;
		this.vueApp = vueApp;
	}
	requestMarketOrders(groupIndex) {
		if (groupIndex < this.vueApp.config.groups.length) {
			let x2js = new X2JS();
			let typeIDs = DbAccess.getTypeIDsFromGroup(this.vueApp.config.groups[groupIndex]);

			for (let typeID of typeIDs) {
				let type = DbAccess.getTypeData(typeID);
				let marketOrderURL = this.generateMarketOrderURL(this.vueApp.config.regions, typeID);
				let buyOrders = [];
				let sellOrders = [];

				this.$http.get(marketOrderURL).then((response) => {
					// parse xml feed to json object
					let body = x2js.xml_str2json(response.body);
					let data = body.evec_api.quicklook;

					if (data.buy_orders.order != undefined && data.sell_orders.order != undefined && data.buy_orders.order.length > 0 && data.sell_orders.order.length > 0) {
						// sort buy orders descending and sell orders ascending
						data.buy_orders.order.sort((a, b) => { return parseFloat(b.price) - parseFloat(a.price); });
						data.sell_orders.order.sort((a, b) => { return parseFloat(a.price) - parseFloat(b.price); });

						data.buy_orders.order = data.buy_orders.order.slice(0, 10);
						data.sell_orders.order = data.sell_orders.order.slice(0, 10);

						// set max buy price and min sell price
						let maxBuyPrice = parseFloat(data.buy_orders.order[0].price);
						let minSellPrice = parseFloat(data.sell_orders.order[0].price);

						// get all buy orders with price higher than min sell price
						for (let order of data.buy_orders.order) {
							// filter order from low sec allowed or not
							this.parseNumberFromApi(order);
							if ((!this.vueApp.config.avoidLowSec || order.security > 0.5) && order.price > minSellPrice && buyOrders.length < 3
								&& order.vol_remain > this.vueApp.config.minQuantity) {
								let station = DbAccess.getStationData(order.station);
								if (station != null) {
									buyOrders.push({
										stationID: order.station,
										stationName: order.station_name,
										systemID: station.solarSystemID,
										quantity: order.vol_remain,
										price: order.price
									});
								}
							}
						}

						// get all sell orders with price lower than max buy price
						for (let order of data.sell_orders.order) {
							// filter order from low sec allowed or not
							this.parseNumberFromApi(order);
							if ((!this.vueApp.config.avoidLowSec || order.security > 0.5) && order.price < maxBuyPrice && sellOrders.length < 3
								&& order.vol_remain > this.vueApp.config.minQuantity) {
								let station = DbAccess.getStationData(order.station);
								if (station != null) {
									sellOrders.push({
										stationID: order.station,
										stationName: order.station_name,
										systemID: station.solarSystemID,
										quantity: order.vol_remain,
										price: order.price
									});
								}
							}
						}

						// match sell orders with buy orders
						for (let sellOrder of sellOrders) {
							for (let buyOrder of buyOrders) {
								let sellAfterTax = sellOrder.price * (1 + (this.vueApp.config.salesTax / 100));
								let buyAfterFee = buyOrder.price * (1 - (this.vueApp.config.brokerFee / 100));

								let minQuantity = Math.min(Math.min(buyOrder.quantity, sellOrder.quantity), this.vueApp.config.maxVolume);
								let profit = parseFloat(((buyAfterFee - sellAfterTax) * minQuantity).toFixed(2));
								let cost = parseFloat((sellAfterTax * minQuantity).toFixed(2));
								let profitPercent = parseFloat((profit * 100 / cost).toFixed(2));
								let volume = parseFloat((minQuantity * type.volume).toFixed(2));
								if (profit > this.vueApp.config.minProfit && profitPercent > this.vueApp.config.minProfitPercent) {
									let newOrder = {
										name: type.typeName,
										quantity: minQuantity,
										volume: volume,
										sellPrice: sellOrder.price,
										sellQuantity: sellOrder.quantity,
										sellStation: sellOrder.stationName,
										buyPrice: buyOrder.price,
										buyQuantity: buyOrder.quantity,
										buyStation: buyOrder.stationName,
										cost: cost,
										profit: profit,
										profitPercent: profitPercent,
										profitPerM3: parseFloat((profit / volume).toFixed(2)),
										profitPerJump: 0,
										route: 0
									};
									this.getJump(sellOrder.systemID, buyOrder.systemID, this.vueApp.orderData.length);
									this.vueApp.orderData.push(newOrder);
								} else {
									this.requestDone++;
								}
							}
						}
					}
				}, (response) => {
					// error
					console.log('requestMarketOrders error: ' + response.body);
				});
			}
			setTimeout(() => { this.requestMarketOrders(groupIndex + 1); }, 1000);
		}
	}

	parseNumberFromApi(apiOrder) {
		apiOrder.price = parseFloat(apiOrder.price);
		apiOrder.security = parseFloat(apiOrder.security);
		apiOrder.vol_remain = parseFloat(apiOrder.vol_remain);
	}

	getJump(from, to, index) {
		this.vueApp.requestStarted++;
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
		this.vueApp.orderData[index].route = jump;
		this.vueApp.orderData[index].profitPerJump = parseFloat((this.vueApp.orderData[index].profit / Math.max(1, jump)).toFixed(2));

		this.vueApp.requestDone++;
	}

	generateRouteJumpURL (from, to) {
		return this.routeJumpURL.replace('{from}', from).replace('{to}', to);
	}

	generateMarketOrderURL (regions, typeID) {
		return this.marketOrderURL + '?regionlimit=' + regions.join('&regionlimit=') + '&typeid=' + typeID;
	}
}