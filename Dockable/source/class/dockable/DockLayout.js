/**
 * Layout item representation.
 */
qx.Class.define('dockable.DockLayout', {

    extend : qx.core.Object,

    /**
     * constructor
     * @param spec {Object} description of a layout
     */
    construct : function ( spec )
    {
        this.base(arguments);
        this.HandleSize = 3;
        this.kids = [];
        if ( spec === null ) {
            this.m_isLeafNode = true;
        }
        else {
            this.m_isLeafNode = false;

            // now go through the spec
            this.colSizes = spec.columns;
            this.rowSizes = spec.rows;
            this.cols = this.colSizes.length;
            this.rows = this.rowSizes.length;

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
            qx.core.Assert.assert(0 <= row && row < this.nRows(), "Bad row");
            qx.core.Assert.assert(0 <= col && col < this.nCols(), "Bad column");
            //            if ( row < 0 || row >= this.rows ) throw "bad row";
            //
            //            if ( col < 0 || col >= this.cols ) throw "bad col";

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
            qx.core.Assert.assert(0 <= row && row < this.nRows(), "Bad row");
            qx.core.Assert.assert(0 <= col && col < this.nCols(), "Bad column");
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
            return this.cols;
        },

        /**
         * Returns number of rows in this layout.
         * @returns {Integer}
         */
        nRows : function ()
        {
            if ( this.isLeafNode() ) return 1;
            return this.rows;
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
         * @param fn {Function} function to invoke. Parameter to this function is
         * the layout reference.
         */
        forEachLayout : function ( fn )
        {
            fn(this);
            if ( this.isLeafNode() ) return;
            var kidIndex = 0;
            for ( var row = 0 ; row < this.nRows() ; row++ ) {
                for ( var col = 0 ; col < this.nCols() ; col++ ) {
                    this.kids[kidIndex].forEachLayout( fn);
                    kidIndex++;
                }
            }
        },

        /**
         * Given rect {width,height}, recomputes sizes of all its children,
         * recursively. This is little more complicated than it would seem
         * at a first glance, mainly because sizes can be specified as floating point
         * values, but on the screen rectangles must have integer positions/sizes,
         * @param rect {} object with width and height
         */
        recomputeRectangles : function ( rect )
        {
            console.log("recomputing for rect", rect);
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
                var pos = [];
                pos[0] = 0;
                var n = sizes.length;
                var avail = width - (n - 1) * spacer;
                var sum = qx.lang.Array.sum(sizes);
                for ( var i = 1 ; i <= n ; i++ ) {
                    // first a floating point value
                    var s = pos[i - 1] + sizes[i - 1] * avail / sum + spacer;
                    // now round it to integer
                    pos[i] = Math.round(s);
                }
                // compose the result rom pos[] array
                for ( var i = 0 ; i < n ; i++ ) {
                    res[i] = {
                        pos : pos[i],
                        width : pos[i + 1] - pos[i] - spacer
                    };
                }
                return res;
            };

            // compute horizontal values
            var columns = compute(this.colSizes, rect.width, this.HandleSize);
            // compute vertical values
            var rows = compute(this.rowSizes, rect.height, this.HandleSize);
            // compute kids
            // recompute kids
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
            return;
            /*
             var availWidth = rect.width - (this.cols - 1) * this.HandleSize;
             var availHeight = rect.height - (this.rows - 1) * this.HandleSize;

             // sum up column sizes
             var colSum = qx.lang.Array.sum(this.colSizes);

             // figure out horizontal sizing/positions
             for ( var i = 0 ; i < this.nCols() ; i++ ) {

             }

             // now normalize to pixels (but we now have floating point values)
             this.colSizes.forEach(function ( val, ind, arr )
             {
             arr[ind] = val / colSum * availWidth;
             });

             // round to integers, keeping the sum
             var pos = 0;
             var lastPos = 0;
             this.colSizes.forEach(function ( val, ind, arr )
             {
             var thisPos = Math.round(pos + val);
             arr[ind] = Math.round(thisPos - lastPos);
             lastPos = thisPos;
             pos += val;
             }, this);

             // do the same for rows
             var rowSum = 0;
             this.rowSizes.forEach(function ( val )
             {
             rowSum += val;
             });
             this.rowSizes.forEach(function ( val, ind, arr )
             {
             arr[ind] = val / rowSum * availHeight;
             });
             pos = 0;
             lastPos = 0;
             this.rowSizes.forEach(function ( val, ind, arr )
             {
             var thisPos = Math.round(pos + val);
             arr[ind] = Math.round(thisPos - lastPos);
             lastPos = thisPos;
             pos += val;
             });

             // recompute kids
             var kidIndex = 0;
             for ( var row = 0 ; row < this.rows ; row++ ) {
             for ( var col = 0 ; col < this.cols ; col++ ) {
             var kidSize = {
             width : this.colSizes[col],
             height : this.rowSizes[row]
             };
             var kid = this.kids[kidIndex];
             kidIndex++;
             kid.recomputeRectangles(kidSize);
             }
             }
             console.log("colSizes", this.colSizes);
             console.log("rowSizes", this.rowSizes);

             */
        }
    }
});
