/**
 * Layout item representation.
 */
qx.Class.define('dockable.DockLayout', {

    extend : qx.core.Object,
    include: qx.core.MAssert,

    /**
     * constructor
     * @param spec {Object} description of a layout
     */
    construct : function ( spec )
    {
        this.base(arguments);
        this.kids = [];
        if ( spec === null ) {
            this.m_isLeafNode = true;
        }
        else {
            this.m_isLeafNode = false;

            // now go through the spec
            this.colSizes = spec.columns;
            this.rowSizes = spec.rows;
//            this.cols = this.colSizes.length;
//            this.rows = this.rowSizes.length;

            // construct kids recursively
            this.kids = [];
            for ( var kidId in spec.kids ) {
                this.kids.push(new dockable.DockLayout(spec.kids[kidId]));
            }

            // make sure we have enough kids
            while ( this.kids.length < this.nRows() * this.nCols() ) {
                this.kids.push(new dockable.DockLayout(null));
            }
        }
        this.m_rectangle = {
            left : 0,
            top : 0,
            width : 1,
            height : 1
        };
    },

    /**
     * events
     */
    events : {
//        "evict" : "qx.event.type.Data"
    },

    /**
     * Properties
     */
    properties : {
      gap : {
          init : 5,
          check : "Integer",
          apply : "_applyGap"
      }
    },

    /**
     * members
     */
    members : {
        /**
         * @type {Boolean} Whether this layout has sub-layout
         */
        m_isLeafNode : false,

        /**
         * @type {Rectangle} Computed rectangle of this layout.
         */
        m_rectangle : null,
        m_tenant: null,

        /**
         * Removes a row from the layout
         * @param row {Integer} which row to remove (0 based)
         */
        removeRow : function ( row) {
            this.assert(0 <= row && row < this.nRows(), "Bad row");
            this.rowSizes.splice( row, 1);
            this.recomputeRectangles();
        },

        /**
         * Remove column.
         * @param col {Integer} which column to remove (0-based)
         */
        removeColumn : function (col) {
            this.assert(0 <= col && col < this.nCols(), "Bad column");
            this.colSizes.splice( col, 1);
            this.recomputeRectangles();
        },

        /**
         * Adjusts the weights to make sure the column starts at pixel 'pos'. Rectangles
         * are automatically recalculated after this. This is normally called when the
         * dock splitters are moved by the user.
         *
         * @param col {Integer} the column to adjust (must be > 0)
         * @param pos {Integer} Pixel position.
         */
        adjustColumnToStartAt : function ( col, pos) {
            var kidRect = this.getKidLayout( 0, col).rectangle();
            var kidRectPrev = this.getKidLayout( 0, col-1).rectangle();
            var sizeArray = this.colSizes;
            var combinedSize = kidRect.width + kidRectPrev.width;
            var combinedWeight = sizeArray[col] + sizeArray[col-1];
            var newSize1 = pos - kidRectPrev.left - this.getGap()/2;
            var newSize2 = combinedSize - newSize1;
            var newWeight1 = newSize1 / combinedSize * combinedWeight;
            var newWeight2 = newSize2 / combinedSize * combinedWeight;
            sizeArray[col-1] = newWeight1;
            sizeArray[col] = newWeight2;
            this.recomputeRectangles();
        },

        /**
         * Adjusts the weights to make sure the row starts at pixel 'pos'. Rectangles
         * are automatically recalculated after this. This is normally called when the
         * dock splitters are moved by the user.
         *
         * @param row {Integer} the row to adjust (must be > 0)
         * @param pos {Integer} Pixel position.
         */
        adjustRowToStartAt : function ( row, pos) {
            var kidRect = this.getKidLayout( row, 0).rectangle();
            var kidRectPrev = this.getKidLayout( row-1, 0).rectangle();
            var sizeArray = this.rowSizes;
            var combinedSize = kidRect.height + kidRectPrev.height;
            var combinedWeight = sizeArray[row] + sizeArray[row-1];
            var newSize1 = pos - kidRectPrev.top - this.getGap()/2;;
            var newSize2 = combinedSize - newSize1;
            var newWeight1 = newSize1 / combinedSize * combinedWeight;
            var newWeight2 = newSize2 / combinedSize * combinedWeight;
            sizeArray[row-1] = newWeight1;
            sizeArray[row] = newWeight2;
            this.recomputeRectangles();
        },


        /**
         * Is the layout occupied by a tenant?
         * @returns {Boolean|boolean} True means it's occupied.
         */
        isOccupied: function() {
            return this.isLeafNode() && this.tenant() != null;
        },

        setTenant: function( tenant) {
            this.assert( this.isLeafNode(), "Cannot set tenant on non-leaf node");
            this.m_tenant = tenant;
        },

        tenant: function () {
            return this.m_tenant;
        },

        /**
         * Returns true if this layout element supports inserting custom objects or no.
         * @return {Boolean} True means custom objects can be inserted. False means
         * this layout item has a sub-layout.
         */
        isLeafNode : function ()
        {
            return this.m_isLeafNode;
        },

        /**
         * sets a sublayout for the given row/column
         * @param row {Integer} row number (0-based)
         * @param col {Integer} column number (0-based)
         * @param kid {DockLayout} the child layout
         */
        setKidLayout : function ( row, col, kid )
        {
            this.assert(0 <= row && row < this.nRows(), "Bad row");
            this.assert(0 <= col && col < this.nCols(), "Bad column");

            var kidIndex = row * this.nCols() + col;
            this.kids[kidIndex] = kid;
        },

        /**
         * Returns all kid layouts.
         * @return {Array} array of layouts
         */
        getAllKidLayouts : function ()
        {
            return this.kids;
        },

        /**
         * Reuturn a particular kid layout at given position.
         * @param row {Integer} row
         * @param col {Integer} column
         * @returns {DockLayout} the layout
         */
        getKidLayout : function ( row, col )
        {
            this.assert(0 <= row && row < this.nRows(), "Bad row");
            this.assert(0 <= col && col < this.nCols(), "Bad column");
            var kidIndex = row * this.nCols() + col;
            return this.kids[kidIndex];
        },

        /**
         * Returns number of columns in this layout.
         *
         * @return {Integer} Number of columns.
         */
        nCols : function ()
        {
            if ( this.isLeafNode() ) return 1;
            return this.colSizes.length;
        },

        /**
         * Returns number of rows in this layout.
         * @returns {Integer}
         */
        nRows : function ()
        {
            if ( this.isLeafNode() ) return 1;
            return this.rowSizes.length;
        },

        /**
         * Returns the computed rectangle for this layout item
         * @param rect {Rectangle}
         */
        rectangle : function ()
        {
            return this.m_rectangle;
        },

        /**
         * Traverses all layouts (and sub-layouts), and invokes the function fn
         * on each.
         *
         * @param fn {Function} function to invoke. Parameter to this function is
         * the layout reference.
         */
        forEachLayout : function ( fn )
        {
            var res = fn(this);
            if( res === "break") return res;

            if ( this.isLeafNode() ) return;
            var kidIndex = 0;
            for ( var row = 0 ; row < this.nRows() ; row++ ) {
                for ( var col = 0 ; col < this.nCols() ; col++ ) {
                    res = this.kids[kidIndex].forEachLayout( fn);
                    if( res === "break") return res;
                    kidIndex++;
                }
            }
            return res;
        },

        /**
         * Given rect {width,height}, recomputes sizes of all its children,
         * recursively. This is little more complicated than it would seem
         * at a first glance, mainly because sizes can be specified as floating point
         * values, but on the screen rectangles must have integer positions/sizes,
         *
         * @param rect {Rectangle?null} object with width and height
         */
        recomputeRectangles : function ( rect )
        {
            if( rect == null) {
                rect = this.rectangle();
            }
            // keep the rectangle
            this.m_rectangle = qx.lang.Object.clone(rect);
            // if this is a leaf node we're done
            if ( this.isLeafNode() ) {
                return;
            }

            var compute = function compute( sizes, width, spacer )
            {
                // res will contain array of {pos,width} objects (integer valued)
                var res = [];
                // compute starting values (n+1 to simplify edge case...)
                var n = sizes.length;
                var avail = width - (n - 1) * spacer;
                var sum = qx.lang.Array.sum(sizes);
                // calculate ideal starting positions (floating point values)
                var pos = [0];
                for ( var i = 1 ; i <= n ; i++ ) {
                    pos[i] = pos[i - 1] + sizes[i - 1] * avail / sum + spacer;
                }
                for ( var i = 0 ; i <= n ; i++ ) {
                    pos[i] = Math.round(pos[i]);
                }
                this.assert( pos[n] === width + spacer, "Internal layout calculation error");

                // compose the result rom pos[] array
                for ( var i = 0 ; i < n ; i++ ) {
                    res[i] = {
                        pos : pos[i],
                        width : pos[i + 1] - pos[i] - spacer
                    };
                }
                return res;
            }.bind(this);

            // compute horizontal values
            var columns = compute(this.colSizes, rect.width, this.getGap());
            // compute vertical values
            var rows = compute(this.rowSizes, rect.height, this.getGap());
            // compute kids
            var kidIndex = 0;
            for ( var row = 0 ; row < this.nRows() ; row++ ) {
                for ( var col = 0 ; col < this.nCols() ; col++ ) {
                    var kidRect = {
                        left : columns[col].pos + rect.left,
                        width : columns[col].width,
                        top : rows[row].pos + rect.top,
                        height : rows[row].width
                    };
                    var kid = this.kids[kidIndex];
                    kidIndex++;
                    kid.recomputeRectangles(kidRect);
                }
            }
        },

        _applyGap : function (value) {
            this.recomputeRectangles( this.rectangle());
        }
    }
});
