Vue.component('data-table', {
	template: '<table id="view-table" class="table table-striped table-bordered"><tfoot><tr><th>Item</th><th>Quantity</th><th>Volume (m3)</th><th>Sell Price</th><th>Sell Qty</th><th>Sell Station</th><th>Buy Price</th><th>Buy Qty</th><th>Buy Station</th><th>Cost</th><th>Gain</th><th>Gain %</th><th>Gain / jump</th><th>Gain / m3</th><th>Route</th></tr></tfoot></table>',
	props: ['orders'],
	data() {
		return {
			headers: [
				{ data: 'name', title: 'Item', width: 200 },
				{ data: 'quantity', title: 'Quantity', width: 80, render: $.fn.dataTable.render.number(',', '.', 0) },
				{ data: 'volume', title: 'Volume (m3)', width: 100, render: $.fn.dataTable.render.number(',', '.', 2, '', ' m3') },
				{ data: 'sellPrice', title: 'Sell Price', width: 100, render: $.fn.dataTable.render.number(',', '.', 2, '', ' ISK') },
				{ data: 'sellQuantity', title: 'Sell Qty', width: 80, render: $.fn.dataTable.render.number(',', '.', 0) },
				{ data: 'sellStation', title: 'Sell Station', width: 350 },
				{ data: 'buyPrice', title: 'Buy Price', width: 100, render: $.fn.dataTable.render.number(',', '.', 2, '', ' ISK') },
				{ data: 'buyQuantity', title: 'Buy Qty', width: 80, render: $.fn.dataTable.render.number(',', '.', 0) },
				{ data: 'buyStation', title: 'Buy Station', width: 350 },
				{ data: 'cost', title: 'Cost', width: 100, render: $.fn.dataTable.render.number(',', '.', 0, '', ' ISK') },
				{ data: 'profit', title: 'Gain', width: 100, render: $.fn.dataTable.render.number(',', '.', 0, '', ' ISK') },
				{ data: 'profitPercent', title: 'Gain %', width: 60, render: $.fn.dataTable.render.number(',', '.', 2, '', '%') },
				{ data: 'profitPerJump', title: 'Gain / jump', width: 100, render: $.fn.dataTable.render.number(',', '.', 0, '', ' ISK') },
				{ data: 'profitPerM3', title: 'Gain / m3', width: 80, render: $.fn.dataTable.render.number(',', '.', 0, '', ' ISK') },
				{ data: 'route', title: 'Route', width: 80, render: $.fn.dataTable.render.number(',', '.', 0, '', ' jump') },
			],
			rows: [],
			table: null
		};
	},
	watch: {
		orders: {
			handler(val, oldVal) {
				this.table.clear();
				this.table.rows.add(val);
				this.table.draw();
			},
			deep: true
		}
	},
	mounted() {
		this.table = $(this.$el).DataTable({
			scrollY: 600,
			scrollCollapse: true,
			paging: false,
			columns: this.headers,
			data: this.rows
		});
	}
});