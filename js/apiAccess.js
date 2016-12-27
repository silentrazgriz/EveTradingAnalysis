class ApiAccess {
	constructor($http) {
		this.marketOrderURL = 'http://api.eve-central.com/api/quicklook?typeid=34&regionlimit=10000002';
		this.routeJumpURL = 'http://api.eve-central.com/api/route/from/{from}/to/{to}';
		this.$http = $http;
	}
	requestMarketOrders(config, orderData, categoryIndex) {
		//if (categoryIndex < config.categories.length) {
			let x2js = new X2JS();
			let buyOrders = [];
			let sellOrders = [];
			let orders = [];

			this.$http.get(this.marketOrderURL).then((response) => {
				// parse xml feed to json object
				let body = x2js.xml_str2json(response.body);
				let data = body.evec_api.quicklook;

				// sort buy orders descending and sell orders ascending
				data.buy_orders.order.sort((a, b) => { return b.price - a.price; });
				data.sell_orders.order.sort((a, b) => { return a.price - b.price; });

				// set max buy price and min sell price
				let maxBuyPrice = data.buy_orders.order[0].price;
				let minSellPrice = data.sell_orders.order[0].price;

				// get all buy orders with price higher than min sell price
				for (let order of data.buy_orders.order) {
					// filter order from low sec allowed or not
					if ((!config.avoidLowSec || buy.security > 0.5) && order.price > minSellPrice && buyOrders.length < 3) {
						buyOrders.push({
							stationID: order.station,
							stationName: order.station_name,
							systemName: order.station_name.split(' ')[0],
							volume: order.volume_remain,
							price: order.price
						});
					}
				}

				// get all sell orders with price lower than max buy price
				for (let order of data.sell_orders.order) {
					// filter order from low sec allowed or not
					if ((!config.avoidLowSec || buy.security > 0.5) && order.price < maxBuyPrice && sellOrders.length < 3) {
						sellOrders.push({
							stationID: order.station,
							stationName: order.station_name,
							systemName: order.station_name.split(' ')[0],
							volume: order.volume_remain,
							price: order.price
						});
					}
				}

				// match sell orders with buy orders
				for (let sellOrder of sellOrders) {
					for (let buyOrder of buyOrders) {
						if (buyOrder.price - sellOrder.price > 0) {
							let newOrder = {};
						}
					}
				}

				console.log(data);
			}, (response) => {
				// error
				console.log('error');
			});
			//setTimeout(this.requestMarketOrders(config, regionIndex, categoryIndex + 1).bind(this), 250);
		//}
	}

	generateRouteJumpURL (from, to) {
		return this.routeJumpURL.replace('{from}', from).replace('{to}', to);
	}

	generateMarketOrderURL (regions, typeID) {
		return this.marketOrderURL + '?regionlimit=' + regions.join('&regionlimit=') + '&typeid=' + typeID;
	}
}