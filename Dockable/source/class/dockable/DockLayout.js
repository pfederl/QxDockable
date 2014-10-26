qx.Class.define('dockable.DockLayout',
{
    extend : qx.core.Object,

    /**
     * constructor
     */
    construct : function(spec)
    {
        this.base(arguments);
        this.HandleSize = 3;
        if (spec === null) {
            this.isNull = true;
        } else {
            this.isNull = false;

            // now go through the spec
            this.rows = spec.rows;
            this.cols = spec.cols;
            this.colSizes = spec.colSizes;
            this.rowSizes = spec.rowSizes;

            // construct kids recursively
            this.kids = [];
            for (var kidId in spec.kids) {
                this.kids.push(new dockable.DockLayout(spec.kids[kidId]));
            }
            // make sure we have enough kids
            while( this.kids.length < this.rows * this.cols) {
                this.kids.push( new dockable.DockLayout(null));
            }
        }
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

        setKid: function(row,col,kid) {
            if( row < 0 || row >= this.rows) throw "bad row";
            if( col < 0 || col >= this.cols) throw "bad col";
            var kidIndex = row * this.cols + col;
            this.kids[kidIndex] = kid;
        },

        recomputeForSize: function( size) {
//            debugger;
            console.log("recomputing for size", size.width, size.height);
            var availWidth = size.width - (this.cols - 1) * this.HandleSize;
            var availHeight = size.height - (this.rows - 1) * this.HandleSize;

            // sum up col sizes
            var colSum = 0;
            this.colSizes.forEach(function (val){ colSum += val; });
            // now normalize to pixels
            this.colSizes.forEach(function (val, ind, arr) {
                arr[ind] = val / colSum * availWidth;
            });
            // round to integers, keeping the sum
            var pos = 0;
            var lastPos = 0;
            this.colSizes.forEach(function (val, ind, arr) {
                var thisPos = Math.round(pos + val);
                arr[ind] = Math.round(thisPos - lastPos);
                lastPos = thisPos;
                pos += val;
            }, this);

            // do the same for rows
            var rowSum = 0;
            this.rowSizes.forEach(function(val){ rowSum += val;});
            this.rowSizes.forEach(function(val,ind,arr){
                arr[ind] = val/rowSum * availHeight;
            });
            pos = 0;
            lastPos = 0;
            this.rowSizes.forEach(function (val, ind, arr) {
                var thisPos = Math.round(pos + val);
                arr[ind] = Math.round(thisPos - lastPos);
                lastPos = thisPos;
                pos += val;
            });

            // recompute kids
            var kidIndex = 0;
            for( var row = 0 ; row < this.rows ; row ++ ) {
                for( var col = 0 ; col < this.cols ; col ++ ) {
                    var kidSize = {
                        width: this.colSizes[col],
                        height: this.rowSizes[row]
                    };
                    var kid = this.kids[kidIndex];
                    kidIndex ++;
                    if( kid.isNull) continue;
                    kid.recomputeForSize( kidSize);
                }
            }

            console.log( "colSizes", this.colSizes);
            console.log( "rowSizes", this.rowSizes);
        }

    }
});
