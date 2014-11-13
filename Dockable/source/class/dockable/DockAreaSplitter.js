/**
 * The DockAreaSplitter is the widget between docked windows that allows
 * the user to drag it and thus resize the dock areas (and any docked windows in those).
 */

qx.Class.define("dockable.DockAreaSplitter", {

    extend : qx.ui.core.Widget,

    /*
     *****************************************************************************
     CONSTRUCTOR
     *****************************************************************************
     */

    /**
     * @param desktop {dockable.Desktop} The parent desktop.
     */
    construct : function ()
    {
        this.base(arguments);

        this.addListener("pointerover", this._onPointerOver, this);
        this.addListener("pointerdown", this._onPointerDown, this);
        this.addListener("pointerup", this._onPointerUp, this);
        this.addListener("pointermove", this._onPointerMove, this);
        this.addListener("pointerout", this._onPointerOut, this);
//        this.addListener("losecapture", this._onPointerUp, this);

    },

    // events
    events : {
        moved : "qx.event.type.Data"
    },

    /*
     *****************************************************************************
     PROPERTIES
     *****************************************************************************
     */

    properties : {

        orientation : {
            init : "horizontal",
            check : ["horizontal", "vertical"],
            apply : "_applyOrientation"
        },

        // overrridden
        allowShrinkX : {
            refine : true,
            init : false
        },

        // overrridden
        allowShrinkY : {
            refine : true,
            init : false
        },

        // overrridden
        appearance : {
            refine : true,
            init : "dock-area-splitter"
        },

        thickness : {
            init : 25,
            check : "Number",
            themeable : true,
            apply : "_applyThickness"
        }

        //        center : {
        //            nullable : 0,
        //            check : "Integer",
        //            apply : "_applyCenter"
        //        }


        //        center : {
        //            nullable : 0,
        //            check : "Number",
        //            apply : "_applyCenter"
        //        },
        //
        //        start : {
        //            init : 0,
        //            check : "Number",
        //            apply : "_applyStart"
        //        },
        //
        //        end : {
        //            init : 10,
        //            check : "Number",
        //            apply : "_applyEnd"
        //        }

    },

    /*
     *****************************************************************************
     MEMBERS
     *****************************************************************************
     */

    members : {

        _dragging : false,
        _clickOffset : 0,
        _start : 0,
        _size : 0,
        _center : 0,
        _minPos : 0,
        _maxPos : 0,
        _lastFiredMoved : null,

        //        setUserBounds : function ( left, top, width, height )
        //        {
        //            this.base(arguments, left, top, width, height);
        //            this._geom = {
        //                left : left,
        //                top : top,
        //                width : width,
        //                height : height
        //            };
        //        },

        _onPointerOver : function ( ev )
        {
            console.log( "das pointer over");
            this.addState("hovered");
        },

        _onPointerDown : function ( ev )
        {
            console.log( "das pointer down");
            // only handle left mouse button
            if ( !ev.isLeftPressed() ) {
                return;
            }
            this._dragging = true;
            this.addState("dragging");
            this.capture( true);
            var pt = this._getRelativePointer(ev);
            if ( this.getOrientation() === "horizontal" ) {
                this._clickOffset = this._center - pt.y;
            }
            else {
                this._clickOffset = this._center - pt.x;
            }
        },

        _onPointerUp : function ( ev )
        {
            console.log( "das pointer up");
            this._dragging = false;
            this.removeState("dragging");
            this.removeState("hovered");
            this.releaseCapture();
            this._fireMovedEvent();
        },

        _onPointerMove : function ( ev )
        {
            console.log( "das pointer move");
            // do nothing if not dragging
            if ( !this._dragging ) return;

            var pt = this._getRelativePointer(ev);
            if ( this.getOrientation() === "vertical" ) {
                this._center = pt.x + this._clickOffset;
            }
            else {
                this._center = pt.y + this._clickOffset;
            }
            if ( this._center < this._minPos ) {
                this._center = this._minPos;
            }
            if ( this._center > this._maxPos ) {
                this._center = this._maxPos;
            }

            this._updateGeometry();
        },

        _onPointerOut : function ( /*ev*/ )
        {
            console.log( "das pointer out");
            this.removeState("hovered");
        },

        /**
         * Will fire a 'moved' event, but only if the previous moved event was different.
         * @private
         */
        _fireMovedEvent : function() {
            if( this.fmecounter == null) {
                this.fmecounter = 0;
            }
            console.log( "fme #" + this.fmecounter + " " + this._lastFiredMoved + " -> " + this._center);

            if( this._center === this._lastFiredMoved) return;
            this._lastFiredMoved = this._center;
            this.fireDataEvent( "moved", { splitter: this, pos: this._center });
            this.fmecounter ++;
        },

        /**
         * Return relative mouse/pointer position wrt. to parent widget
         * @param ev {Event} event to be translated
         * @returns {{x: number, y: number}} the relative position
         * @protected
         */
        _getRelativePointer : function ( ev )
        {
            var parent = this.getLayoutParent().getContentLocation();
            return {
                x : ev.getDocumentLeft() - parent.left,
                y : ev.getDocumentTop() - parent.top
            };
        },

        _applyOrientation : function ( value /*, old*/ )
        {
            if ( value === "horizontal" ) {
                this.setCursor("row-resize")
            }
            else {
                this.setCursor("col-resize");
            }
            this._updateGeometry();
        },

        _applyThickness : function ( value )
        {
            this._updateGeometry();
        },

        setPos : function ( start, size, center, minPos, maxPos )
        {
            console.log( "das setPos", arguments);
            this._start = Math.round(start);
            this._size = Math.round(size);
            this._center = Math.round(center);
            this._minPos = minPos;
            this._maxPos = maxPos;

            this._updateGeometry();
        },

        _updateGeometry : function ()
        {
            var t = this.getThickness();
            var c1 = Math.floor(this._center - t / 2);
            if ( this.getOrientation() == "horizontal" ) {
                this.setUserBounds(this._start, c1, this._size, t);
            }
            else {
                this.setUserBounds(c1, this._start, t, this._size);
            }
        }

    }
});