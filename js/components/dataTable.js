Vue.component('data-table', {
	template: '<table id="view-table" class="table table-striped table-bordered"></table>',
	props: ['orders'],
	data() {
		return {
			headers: [
				{ data: 'name', title: 'Item', width: 200 },
				{ data: 'quantity', title: 'Quantity', width: 80, className: 'text-right', render: $.fn.dataTable.render.number(',', '.', 0) },
				{ data: 'volume', title: 'Volume (m3)', width: 100, className: 'text-right', render: $.fn.dataTable.render.number(',', '.', 2, '', ' m3') },
				{ data: 'sellPrice', title: 'Sell Price', width: 100, className: 'text-right', render: $.fn.dataTable.render.number(',', '.', 2, '', ' ISK') },
				{ data: 'sellQuantity', title: 'Sell Qty', width: 80, className: 'text-right', render: $.fn.dataTable.render.number(',', '.', 0) },
				{ data: 'sellStation', title: 'Sell Station', width: 350 },
				{ data: 'buyPrice', title: 'Buy Price', width: 100, className: 'text-right', render: $.fn.dataTable.render.number(',', '.', 2, '', ' ISK') },
				{ data: 'buyQuantity', title: 'Buy Qty', width: 80, className: 'text-right', render: $.fn.dataTable.render.number(',', '.', 0) },
				{ data: 'buyStation', title: 'Buy Station', width: 350 },
				{ data: 'cost', title: 'Cost', width: 100, className: 'text-right', render: $.fn.dataTable.render.number(',', '.', 0, '', ' ISK') },
				{ data: 'profit', title: 'Profit', width: 100, className: 'text-right', render: $.fn.dataTable.render.number(',', '.', 0, '', ' ISK') },
				{ data: 'profitPercent', title: 'Profit %', width: 60, className: 'text-right', render: $.fn.dataTable.render.number(',', '.', 2, '', '%') },
				{ data: 'profitPerJump', title: 'Profit / jump', width: 100, className: 'text-right', render: $.fn.dataTable.render.number(',', '.', 0, '', ' ISK') },
				{ data: 'profitPerM3', title: 'Profit / m3', width: 80, className: 'text-right', render: $.fn.dataTable.render.number(',', '.', 0, '', ' ISK') },
				{ data: 'route', title: 'Route', width: 80, className: 'text-right', render: $.fn.dataTable.render.number(',', '.', 0, '', ' jump') },
			],
			rows: [],
			table: null
		};
	},
	watch: {
		orders(val, oldVal) {
			this.table.clear();
			this.table.rows.add(val);
			this.table.draw();
		}
	},
	methods: {

	},
	mounted() {
		this.table = $(this.$el).DataTable({
			scrollY: 500,
			scrollCollapse: true,
			paging: false,
			columns: this.headers,
			data: this.rows
		});
	}
});