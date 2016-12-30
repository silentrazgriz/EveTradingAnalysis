class EveApp {
	constructor(vueSelector, tableSelector) {
		this.app = new Vue({
			el: vueSelector,
			data: {
				config: {
					salesTax: 2, // done
					brokerFee: 3, // done
					minProfit: 0, // done
					minProfitPercent: 0, // done
					minProfitPerJump: 0,
					maxJump: 10,
					maxVolume: 10000, // done
					minQuantity: 10, // done
					avoidLowSec: true, // done
					regions: [],
					categories: [],
					groups: []
				},
				eveData: {
					factions: eveFactions,
					regions: eveRegions,
					groups: eveGroups,
					categories: eveCategories
				},
				requestStarted: 0,
				requestDone: 0,
				progress: 0,
				orderData: []
			},
			methods: {
				findOrders(e) {
					e.preventDefault();

					this.progress = 0;
					this.requestStarted = 0;
					this.requestDone = 0;

					this.orderData = [];
					this.config.groups = [];
					for (let category of this.config.categories) {
						this.config.groups = this.config.groups.concat(DbAccess.getGroupIDsFromCategory(category));
					}

					let api = new ApiAccess(this.$http, this);
					api.requestMarketOrders(0);
				}
			},
			computed: {
				progress() {
					return parseInt(this.requestDone * 100 / this.requestStarted);
				}
			}
		});
	}
}