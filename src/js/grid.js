! function ($) {

    "use strict"; // jshint ;_;

    /* GRID PUBLIC CLASS DEFINITION
     * =============================== */

    var Grid = function (element, options) {
        this.init('grid', element, options)
    }

    Grid.prototype = {

        constructor: Grid

        ,
        init: function (type, element, options) {
            this.type = type;
            this.$element = $(element);
            this.$table;
            this.options = this.getOptions(options);
            this.enabled = true;
            this.loading = true;

			console.log('sortID!: ' +  this.options.sortId);
            this.sortColCurrent = {
                id: this.options.sortId,
                order: this.options.sortOrder
            };
            
            console.log(this.sortColCurrent);

            this.create();
        }

        ,
        getOptions: function (options) {
            if (typeof options.cellRenderer !== 'object') {
                options.cellRenderer = null;
                delete options.cellRenderer;
            }
            else {
                options.cellRenderer = $.extend({}, $.fn[this.type].defaults.cellRenderer, options.cellRenderer);
            }

            options = $.extend({}, $.fn[this.type].defaults, options, this.$element.data());

            if (options.currentPage >= options.pages) options.currentPage = options.pages - 1;

			if ( options.firstColumnIsACheckboxColumn === true )
			{
				options.cols.unshift({
					label: '&nbsp;',
					id: 'check',
					width: '10px',
					sortable: false,
					defaultValue: '[checkbox]'
				});
			}
			console.log( options.firstColumnIsACheckboxColumn);
			console.log(options.cols);
	
            return options;
        }

        ,
        create: function () {
            this.$table = this.template();
            this.$table.detach();
            this.$element.html('').append(this.$table);

			var colData = this.getColDataById(this.sortColCurrent.id);
			var sortType = colData.sortType || 'string';
			sortType = (typeof sortType == 'string' && sortType.toLowerCase() === 'numeric') ? 'numeric' : 'string';

			var _params = {
				'order': this.sortColCurrent.order,
				'variable': this.sortColCurrent.id,
				'num': this.options.rowNum,
				'sortType': sortType,
				'page': this.options.currentPage,
				action: this.options.action
			};

            this.setContent(_params);
        }

        ,
        setContent: function ( _params ) {
            if (this.options.dataType == 'array') {
            	this.sortColCurrent.id    = _params.variable;
                this.sortColCurrent.order = _params.order;		
                
                this.options.pages = parseInt(this.options.data.length/this.options.rowNum)+1;			

				console.log('currentPage : ' + this.options.currentPage );

                if ( parseInt(_params.page) <  this.options.pages )
	                this.options.currentPage = parseInt(_params.page);			
	            else
                	this.options.currentPage = this.options.pages - 1;

                this.options.data = this.sortData(this.sortColCurrent.id, this.sortColCurrent.order);

                this.updateHtmlWithData();
                this.setReadyState();
                this.execRenderComplete();
            }
            else if (this.options.dataType == 'json') {
                var that = this;
                this.setLoadingState();

                $.ajax({
                    type: "POST",
                    url: this.options.url,
                    async: true,
                    dataType: 'json',
                    data: _params,
                    error: function (response) {
                        console.log('GRID: error loading !');
                        that.setReadyState();
                    },
                    success: function (response) {
                        that.options.data = response.data;

                        if (response.pages && (typeof response.pages == 'string' || typeof response.pages == 'number')) 				   			
                        	that.options.pages = parseInt(response.pages);
                        
                        that.sortColCurrent.id    = _params.variable;
                        that.sortColCurrent.order = _params.order;						
		
		                that.options.currentPage = parseInt(_params.page);						

                        that.updateHtmlWithData();
                        that.setReadyState();

                        that.execRenderComplete();
                    }
                });
            }
        }

        ,
        execRenderComplete: function () {
            if (this.options.tableRenderComplete === null) return;

            this.options.tableRenderComplete.call(this, this.$table);
        }

        ,
        setLoadingState: function () {
            this.loading = true;
            this.$table.addClass('loading')
                .removeClass('table-striped')
                .removeClass('table-hover');

            $('thead td', this.$table)
                .addClass('mark-sortable')
                .removeClass('sortable');
        },
        setReadyState: function () {
            this.loading = false;
            this.$table.removeClass('loading')
                .addClass('table-striped')
                .addClass('table-hover');

            $('thead td.mark-sortable', this.$table)
                .addClass('sortable')
                .removeClass('mark-sortable');
        },
        getColDataById: function (id) {
            if (id == '') return null;

            for (var i = 0; i < this.options.cols.length; i++) {
                var data = this.options.cols[i];
                if (data.id == id) return data;
            }

            return null;
        }
        ,
        getRowDataById: function (id) {
            if (id == '' || id == undefined || id == null) return null;

            for (var i = 0; i < this.options.data.length; i++) {
                var data = this.options.data[i];
                if (data.id == id) return data;
            }

            return null;
        }
        ,
        headerClick: function (event) {
            if (this.loading === true) return;

            var id = $(event.currentTarget).attr('data-col-id');
            var colData = this.getColDataById(id);

            if (colData == null) return;
            if (colData.sortable === false) return;

            $('thead td > i', this.$element)
                .removeClass();

            this.options.currentPage = 0;

			var sortType = colData.sortType || 'string';
			sortType = (typeof sortType == 'string' && sortType.toLowerCase() === 'numeric') ? 'numeric' : 'string';

			var _params = {
				'num': this.options.rowNum,
				'sortType': sortType,
				'page': 0,
				action: this.options.action
			};

			var $el = $('thead td[data-col-id=' + id + '] > i', this.$element)

            _params.variable = id;
			_params.order    = 'desc';
            if (this.sortColCurrent.id == id) {
                _params.order = 'asc';

                if (this.sortColCurrent.order == 'asc') 
                  	_params.order = 'desc';
            }

            this.setContent(_params);
        }

        ,
        updateHtmlWithData: function () {

            var $thead = $('thead', this.$table);
            var $tbody = $('tbody', this.$table);
            var $tfoot = $('tfoot', this.$table);

			// THEAD
			var $el = $('thead td[data-col-id=' + this.sortColCurrent.id + '] > i', this.$element);
			if (this.sortColCurrent.order == 'desc')
				$el.addClass('icon-chevron-down');
			else 
				$el.addClass('icon-chevron-up');
			

            var cols = this.options.cols;
            var data = this.options.data;

            $tbody.empty();

			var offset = 0;
			if (  this.options.dataType == 'array' )
			{
				offset = this.options.rowNum*this.options.currentPage;
			}

            for (var m = 0; m < this.options.rowNum ; m++) {
            	var i = m + offset;
            	
                var cdata = (i < this.options.data.length) ? this.options.data[i] : {
                    id: 'no-data'
                };

                var $trow = $('<tr></tr>')
                				.addClass('normal')
                				.attr('data-row-id', cdata.id)
                				.attr('data-row-order', m );

				var cellRenderer = this.options.cellRenderer;
					
                for (var j = 0; j < cols.length; j++) {
					var celVal = cdata[cols[j].id];

                    var $el = $('<td></td>')
                    			.attr('data-col-id', cols[j].id)
                				.attr('data-row-id', cdata.id)
                				.attr('data-row-order', m );
                	
					this.setResponsiveHiddenBehavior($el, j);

					
                    // CELL RENDERER BY CELL VALUE
                    if (typeof celVal == 'string' && 
                    	typeof cellRenderer[celVal] == 'function') 
                    {
                        var cr = cellRenderer[celVal];
                        $el.html(cr(cdata.id, cdata));
                    }
                    else if ( this.validateCellDataFormat(celVal) ) 
                    {
						$el.html(celVal.toString());
					}
					
                    // CELL RENDERER BY COL DEFAULT VALUE
                    else if (typeof cols[j].defaultValue == 'string' && 
                    		 typeof cellRenderer[cols[j].defaultValue] == 'function' 
                    		 ) 
                    {
                    	if (  cdata.id !== 'no-data' )
                    	{
	                       var cr = cellRenderer[cols[j].defaultValue];
		                    $el.html(cr(cdata.id, cdata));
		                }
		                else
		                	$el.html('&nbsp;');
                    }
                    
                    // DEFAULT VALUE
                    else if ( this.validateCellDataFormat(cols[j].defaultValue) ) 
                    		 $el.html(cols[j].defaultValue.toString());

                    else $el.html('&nbsp;');
					
					$el.on('click', this.inCellClick, $.proxy(this.inCellClick, this));
                    $trow.append($el);
                }

				$trow.on('click', this.inRowClick, $.proxy(this.inRowClick, this));
                $tbody.append($trow);
            }

            // TFOOT
            var that = this;
            
            if (this.options.pager === true) {
                var $ul = $('div.pagination ul', $tfoot);
                $ul.html('');

                var createli = function (e) {
                    var $li = $('<li><a href="javascript:void(0);">' + e + '</a></li>');
                    
                    if ( e == '...') $li.find('a').addClass('not-active');
                    
                    return $li;
                };

                var createInternalLi = function (e) 
                {
                    (function (temp) {
                        createli(temp + 1)
                            .find('a')
                            .attr('data-page', temp)
                            .each(function () {
	                            if (temp == that.options.currentPage) $(this)
    	                            .addClass('active btn-info');
        		            })
                            .end()
                            .appendTo($ul);
                    })(e);
                };

                if ( this.options.currentPage != 0 )
	                createli('«')
	                	.find('a')
		                .attr('data-page', this.options.currentPage - 1)
		                .end()
		                .appendTo($ul);

                if ( this.options.pages <= 7 )  
                {
                    for (var k = 0; k < this.options.pages; k++)
                    createInternalLi(k);
                }
                else 
                {
                    if (this.options.currentPage < 3) 
                    {
                        for (var k = 0; k < 5; k++)
                    	    createInternalLi(k);
	
                        createli('...').appendTo($ul);
                        createInternalLi(this.options.pages - 1);
                    }
                    else if (this.options.currentPage >= 3 && this.options.currentPage < this.options.pages - 3) 
                    {
                        createInternalLi(0);
                        createli('...').appendTo($ul);

                        for (var k = -1; k <= 1; k++)
                        {
                        	createInternalLi(k+this.options.currentPage);
                        }

                        createli('...').appendTo($ul);
                        createInternalLi(this.options.pages - 1);
                    }
                    else 
                    {
                        createInternalLi(0);
                        createli('...').appendTo($ul);

                        for (var k = this.options.pages - 4; k < this.options.pages; k++)
                        {
                        	console.log('iter2 '+k + ' ' + this.options.currentPage);
                       		createInternalLi(k);
                       	}
                    }
                }
				
				if ( this.options.currentPage != this.options.pages - 1 )
	                createli('»')
	                	.find('a')
	                	.attr('data-page', this.options.currentPage + 1)
	                	.end()
	                	.appendTo($ul);
                
                $('a[data-page]',$ul).on('click', this.pagerClick, $.proxy(this.pagerClick, this));
            }
        }

		,
		inRowClick: function(event) {
			console.log('inRowClick');
			
			if ( typeof this.options.rowClick !== 'function') return;
			
			var id = $(event.currentTarget).attr('data-row-id');
			var data = this.getRowDataById(id);

			this.options.rowClick(event.currentTarget, data);
 		}
		
		,
		inCellClick: function(event) {
			console.log('inCellClick');
			
			if ( typeof this.options.cellClick !== 'function') return;
			
			var rid = $(event.currentTarget).attr('data-row-id');
			var cid = $(event.currentTarget).attr('data-col-id');
			var data = this.getRowDataById(rid);

			this.options.cellClick(event.currentTarget, data, cid);
 		}

		,
		pagerClick: function(event) {
			console.log('pager Click');
            if (this.loading === true) return;

            var page = $(event.currentTarget).attr('data-page');
	
			if ( page == this.options.currentPage ) return;
				
			var colData = this.getColDataById(this.sortColCurrent.id);
			var sortType = colData.sortType || 'string';
			sortType = (typeof sortType == 'string' && sortType.toLowerCase() === 'numeric') ? 'numeric' : 'string';

			var _params = {
				'order': this.sortColCurrent.order,
				'variable': this.sortColCurrent.id,
				'num': this.options.rowNum,
				'sortType': sortType,
				'page': page,
				action: this.options.action
			};

            this.setContent(_params);
		}
		
        ,
        sortData: function (id, order) {
            var arr = [];
            var orderObj = {};

            var colData = this.getColDataById(id);

            for (var i = 0; i < this.options.data.length; i++) 
            {
                var d = this.options.data[i];
                arr.push(d[id]);
                orderObj[i] = d[id];
            }

            // SORT TYPE
            var sortType = colData.sortType || 'string';
            sortType = (typeof sortType == 'string' && sortType.toLowerCase() === 'numeric') ? 'numeric' : 'string';

            if (sortType === 'numeric') arr.sort(function (a, b) {
                return parseFloat(a) - parseFloat(b);
            });
            else arr.sort();

            if (order === "asc") arr.reverse();

            // set new data order
            var farr = [];
            for (var i = 0; i < arr.length; i++) {
                var ord;
                for (var k in orderObj) {
                    if (arr[i] == orderObj[k]) {
                        ord = k;
                        delete orderObj[k];
                    }
                }

                farr[i] = this.options.data[ord];
            }

            return farr;
        }
        
        ,
        validateCellDataFormat:function( data ) {
        	if (typeof data == 'string' || 
                typeof data == 'number') return true;
                
            return false;
        }

        ,
        template: function () {
            this.$content = this.$content || $(this.options.template)

            var $thead = $('thead', this.$content);
            var $tbody = $('tbody', this.$content);
            var $tfoot = $('tfoot', this.$content);

            var cols = this.options.cols;

            // head
            var $trow = $('<tr></tr>');

            var sortOrderIconClass = (this.options.sortOrder == "asc") ? "icon-chevron-up" : "icon-chevron-down";

            for (var i = 0; i < cols.length; i++) {
                var data = cols[i];
                var sortIconClass = "";

                var $el = $('<td></td>');
                $el.attr('data-col-id', data.id);
                this.setResponsiveHiddenBehavior($el,i);
                
                if ( this.options.firstColumnIsACheckboxColumn === true && i == 0 )
                {
                	$('<input ></input>')
                		.attr('type', 'checkbox')
                		.on('click', this.selectAllCheckBoxClick, $.proxy(this.selectAllCheckBoxClick, this))
                		.appendTo($el);

                	$el.attr('width', data.width);
					$trow.append($el);
					continue;
                }

                if (data.id == this.options.sortId && this.options.sortable === true && 
                	data.sortable !== false) sortIconClass = sortOrderIconClass;

                if (this.options.sortable === true && data.sortable !== false) {
                    $el.addClass('sortable');
                    $el.on('click', this.headerClick, $.proxy(this.headerClick, this))
                }

                $el.html(data.label + " <i class='" + sortIconClass + "'>")
                    .attr('width', data.width);

                $trow.append($el);
            }

            $thead.append($trow);

            // TBODY		
            for (i = 0; i < this.options.rowNum; i++) {
                var $trow = $('<tr></tr>')
                				.addClass('normal');

                for (var j = 0; j < cols.length; j++) {
                    var $el = $('<td></td>');
                    $el.html('&nbsp;');
                    $trow.append($el);
                }

                $tbody.append($trow);
            }

            // TFOOTER
            if (this.options.pager === true) {
                var $pager = $('<tr><td colspan="' + cols.length +
                    '"><div class="pagination pagination-small pagination-centered"><ul ></ul></div></td></tr>');
                $tfoot.append($pager);
            }

            return this.$content;
        }
        
        ,
        selectAllCheckBoxClick:function(event){
        	if ( event.currentTarget.checked == null || 
	        	event.currentTarget.checked == undefined ) 
	        	return;
	        	
	        if ( event.currentTarget.checked )
	        	$('tbody td input[type=checkbox]').attr('checked','true');
	        else
	        	$('tbody td input[type=checkbox]').removeAttr('checked');
        }
        
        ,
		setResponsiveHiddenBehavior:function ($el, $order){
			if ( this.options.responsive !== true ) return;
			
			if ( this.options.firstColumnIsACheckboxColumn == false )
			{
				if ( $order >= 1 ) $el.addClass('hidden-phone');
				if ( $order >= 3 ) $el.addClass('hidden-tablet');
			}
			else {
				if ( $order >= 2 ) $el.addClass('hidden-phone');
				if ( $order >= 4 ) $el.addClass('hidden-tablet');
			}
		}
		
		,
        /* RENDERERS *******/
        renderCheckBox: function (rowId, data) {
        	return $('<input ></input>')
        				.attr('type','checkbox')
        				.attr('id','chk-'+rowId)
        				.attr('value', rowId)
        				.addClass('table-checkbox');
        }

        ,
        validate: function () {
            if (!this.$element[0].parentNode) {
                this.hide()
                this.$element = null
                this.options = null
            }
        }

        ,
        enable: function () {
            this.enabled = true
        }

        ,
        disable: function () {
            this.enabled = false
        }

        ,
        destroy: function () {
            this.hide()
                .$element.off('.' + this.type)
                .removeData(this.type)
        }
    }

    /* GRID PLUGIN DEFINITION
     * ========================= */

    $.fn.grid = function (option) {
        return this.each(function () {
            var $this = $(this),
                data = $this.data('grid'),
                options = typeof option == 'object' && option
            if (!data) $this.data('grid', (data = new Grid(this, options)))
            if (typeof option == 'string') data[option]()
        })
    }

    $.fn.grid.Constructor = Grid

    $.fn.grid.defaults = {
        template: '<table class="table table-hover table-striped  table-bordered grid-table" ><thead></thead><tbody></tbody><tfoot></tfoot></table>',
        url: '',
        type: "array",
        sortOrder: "desc",
        sortId: 'col1',
        dataType: 'array',
        rowNum: 10,
        sortable: true,

        pager: true,
        currentPage: 0,
        pages: 1,
		responsive:false,
		firstColumnIsACheckboxColumn:false,
        cols: [{
            label: 'Col1',
            id: 'col1',
            width: '33%',
            sortable: true,
            sortType: 'string',
            defaultValue: '&nbsp;'
        }, {
            label: 'Col2',
            id: 'col2',
            width: '33%',
            sortable: false,
            sortType: 'string'
        }, {
            label: 'Col3',
            id: 'col3',
            width: '34%',
            sortable: true,
            sortType: 'string'
        }],
        data: [{
            id: "0",
            col1: "content 1.1",
            col2: "content 1.2",
            col3: "content 1.3"
        }, {
            id: "1",
            col1: "content 2.1",
            col2: "content 2.2",
            col3: "content 2.3"
        }, {
            id: "2",
            col1: "content 3.1",
            col2: "content 3.2",
            col3: "content 3.3"
        }, {
            id: "3",
            col1: "content 4.1",
            col2: "content 4.2",
            col3: "content 4.3"
        }, {
            id: "4",
            col1: "content 5.1",
            col2: "content 5.2",
            col3: "content 5.3"
        }],
        rowClick:null,
        cellClick:null,
        cellRenderer: {
            '[checkbox]': (function () {
                return Grid.prototype.renderCheckBox;
            })()
        },
        tableRenderComplete: null
    }

}(window.jQuery);