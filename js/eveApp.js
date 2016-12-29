class EveApp {
	constructor(vueSelector, tableSelector) {
		this.app = new Vue({
			el: vueSelector,
			data: {
				config: {
					salesTax: 2,
					brokerFee: 3,
					minProfit: 0,
					minProfitPercent: 0,
					minProfitPerJump: 0,
					maxJump: 10,
					maxVolume: 10000,
					minVolume: 0,
					avoidLowSec: true,
					regions: [],
					groups: []
				},
				eveData: {
					factions: eveFactions,
					regions: eveRegions,
					groups: eveGroups,
					categories: eveCategories
				},
				progress: 0,
				orderData: []
			},
			methods: {
				findOrders: function(e) {
					e.preventDefault();
					this.orderData = [];
					this.progress = 0;
					let api = new ApiAccess(this.$http, this.orderData);
					api.requestMarketOrders(this.config, 0);
				}
			}
		});
	}
}