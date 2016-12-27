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
					categories: []
				},
				eveData: {
					regions: eveRegions,
					categories: eveCategories
				},
				orderData: []
			},
			methods: {
				findOrders: function(e) {
					e.preventDefault();
					let api = new ApiAccess(this.$http);
					api.requestMarketOrders(this.config, this.orderData, 0);
				}
			}
		});

		this.table = $(tableSelector).DataTable({
			scrollY: '400px',
			scrollCollapse: true,
			paging: false,
			columns: [
				{ title: 'Item name' },
				{ title: 'Volume' },
				{ title: 'Sell Price' },
				{ title: 'Sell Volume' },
				{ title: 'Sell Station' },
				{ title: 'Buy Price' },
				{ title: 'Buy Volume' },
				{ title: 'Buy Station' },
				{ title: 'Cost' },
				{ title: 'Profit %' },
				{ title: 'Profit' },
				{ title: 'Profit / Jump' },
				{ title: 'Profit / m3' },
				{ title: 'Route' }
			]
		});
	}
}