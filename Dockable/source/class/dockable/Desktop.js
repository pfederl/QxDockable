/**
 * replacement for qx.ui.window.Desktop with dockable window capabilities.
 */

qx.Class.define("dockable.Desktop", {

    extend : qx.ui.window.Desktop,

    construct : function ()
    {
        var windowManager = new dockable.WindowManager();
        this.base(arguments, windowManager);

        // create underlay canvas
        this.m_underlayCanvas = new qx.ui.embed.Canvas().set({
            syncDimension : true,
            anonymous : true
        });
        this.m_underlayCanvas.addListener("redraw", this._bgUnderlayCanvasRedraw, this);
        this.add(this.m_underlayCanvas, {
            left : 0,
            top : 0,
            edge : 0
        });
        // create overlay canvas
        this.m_overlayCanvas = new qx.ui.embed.Canvas().set({
            canvasWidth : 200,
            canvasHeight : 200,
            syncDimension : true,
            anonymous : true
        });
        this.m_overlayCanvas.addListener("redraw", this._bgOverlayCanvasRedraw, this);
        this.add(this.m_overlayCanvas, {
            left : 0,
            top : 0,
            edge : 0
        });
        this.m_overlayCanvas.setZIndex(2e5);
        this.m_overlayCanvas.getContentElement().setStyle("pointer-events", "none", true);
        this.m_overlayCanvas.exclude();

        this.addListener("resize", this._onDesktopResize, this);

        this.addListener("pointermove", this._pointermoveCB, this, true);
        this.addListener("keydown", function ( e )
        {
            console.log("desktop keydown", e.getKeyCode(), e.getKeyIdentifier());
            e.stopPropagation();
        }, this, false);

        this._splitterWidgets = [];
    },

    members : {

        _updateUnderlay : function ()
        {
            this.m_underlayCanvas.update();
            return;

            var count = 0;
            this.m_layout.forEachLayout(function ( layout )
            {
                if ( !layout.isLeafNode() ) return;
                if ( layout.tenant() != null ) return;
                var w = this._getAreaWidget(count);
                var r = layout.rectangle();
                w.setUserBounds(r.left, r.top, r.width, r.height);
                w.setHighlighted(layout == this.m_selectedLayout);
                count++;
            }.bind(this));

            // hide unused area widgets
            for ( var ind = count ; ind < this._areaWidgets.length ; ind++ ) {
                this._areaWidgets[ind].exclude();
            }
        },

        _pointermoveCB : function ( e )
        {
            if ( e.isShiftPressed() ) {
                this.m_overlayCanvas.show();
                this.m_overlayCanvas.update();
                e.stopPropagation();
                e.preventDefault();
            }
            else {
                this.m_overlayCanvas.exclude();
            }
        },

        /**
         * Draws a rounded rectangle using the current state of the canvas.
         * If you omit the last three params, it will draw a rectangle
         * outline with a 5 pixel border radius.
         * @note copied from http://stackoverflow.com/questions/1255512/how-to-draw-a-rounded-rectangle-on-html-canvas
         * @param {CanvasRenderingContext2D} ctx
         * @param {Number} x The top left x coordinate
         * @param {Number} y The top left y coordinate
         * @param {Number} width The width of the rectangle
         * @param {Number} height The height of the rectangle
         * @param {Number} radius The corner radius. Defaults to 5;
         * @param {Boolean} fill Whether to fill the rectangle. Defaults to false.
         * @param {Boolean} stroke Whether to stroke the rectangle. Defaults to true.
         */
        roundRect : function ( ctx, x, y, width, height, radius, fill, stroke )
        {
            if ( typeof stroke == "undefined" ) {
                stroke = true;
            }
            if ( typeof radius === "undefined" ) {
                radius = 5;
            }
            ctx.beginPath();
            ctx.moveTo(x + radius, y);
            ctx.lineTo(x + width - radius, y);
            ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
            ctx.lineTo(x + width, y + height - radius);
            ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
            ctx.lineTo(x + radius, y + height);
            ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
            ctx.lineTo(x, y + radius);
            ctx.quadraticCurveTo(x, y, x + radius, y);
            ctx.closePath();
            if ( stroke ) {
                ctx.stroke();
            }
            if ( fill ) {
                ctx.fill();
            }
        },

        /**
         * Set a layout.
         * @param layout {DockLayout} description of the layout
         */
        setDockLayout : function ( layout )
        {
            //            this.m_layout = new dockable.DockLayout(layoutSpec);
            this.m_layout = layout;
        },

        /**
         * Returns a pointer to the current dock layout
         * @param
         */
        dockLayout: function() {
            return this.m_layout;
        },

        /**
         * Callback for rendering the underlay canvas.
         * @param e
         * @private
         */
        _bgUnderlayCanvasRedraw : function ( e )
        {
            this.debug("Underlay redraw");

            var data = e.getData();
            var width = data.width;
            var height = data.height;
            var ctx = data.context;
            ctx.clearRect(0, 0, width, height);
            ctx.fillStyle = "rgba(0,0,0,0.1)";

            this.m_layout.forEachLayout(function ( layout )
            {
                if ( !layout.isLeafNode() ) return;
                if ( layout.isOccupied() ) return;

                var r = layout.rectangle();
//                ctx.fillRect(r.left, r.top, r.width, r.height);
                this.roundRect(ctx, r.left, r.top, r.width, r.height, 10, true, false);
            }.bind(this));

            if ( this.m_selectedLayout != null ) {
                var w = 3;
                ctx.fillStyle = "rgba(0,0,0,0.1)";
                var r = this.m_selectedLayout.rectangle();
                //                ctx.fillRect(r.left, r.top, r.width, r.height);
                ctx.lineWidth = w;
                ctx.strokeStyle = "rgba(0,0,0,1)";
                if ( ctx.setLineDash ) {
                    ctx.setLineDash([5, 2]);
                }
                this.roundRect(ctx, r.left + w / 2, r.top + w / 2, r.width - w, r.height - w, 10, true, true);
            }
        },

        _updateResizeWidgets : function ()
        {
            var count = 0;
            this.m_layout.forEachLayout(function ( layout )
            {
                if ( layout.isLeafNode() ) return;
                var rect = layout.rectangle();
                for ( var row = 1 ; row < layout.nRows() ; row++ ) {
                    var kidRectPrev = layout.getKidLayout(row - 1, 0).rectangle();
                    var kidRect = layout.getKidLayout(row, 0).rectangle();
                    var y = kidRect.top - layout.getGap() / 2;
                    var rw = this._getSplitterWidget(count);
                    rw.setOrientation("horizontal");
                    rw.setPos(rect.left, rect.width, y, kidRectPrev.top, kidRect.top + kidRect.height);
                    rw.setUserData("dockInfo", {
                        ind : row,
                        layout : layout,
                        kidRect : kidRect,
                        kidRectPrev : kidRectPrev
                    });
                    count++;
                }
                for ( var col = 1 ; col < layout.nCols() ; col++ ) {
                    var kidRectPrev = layout.getKidLayout(0, col - 1).rectangle();
                    var kidRect = layout.getKidLayout(0, col).rectangle();
                    var x = kidRect.left - layout.getGap() / 2;
                    var rw = this._getSplitterWidget(count);
                    rw.setOrientation("vertical");
                    rw.setPos(rect.top, rect.height, x, kidRectPrev.left, kidRect.left + kidRect.width);
                    rw.setUserData("dockInfo", {
                        ind : col,
                        layout : layout,
                        kidRect : kidRect,
                        kidRectPrev : kidRectPrev
                    });
                    count++;
                }
            }.bind(this));

            // hide unused splitters
            for ( var ind = count ; ind < this._splitterWidgets.length ; ind++ ) {
                this._splitterWidgets[ind].exclude();
            }
        },

        _getSplitterWidget : function ( ind )
        {
            if ( this._splitterWidgets == null ) {
                this._splitterWidgets = [];
            }
            if ( this._splitterWidgets[ind] == null ) {
                var widget = new dockable.DockSplitter();
                widget.setThickness(25);
                this.add(widget, {});
                this._splitterWidgets[ind] = widget;
                widget.addListener("moved", this._splitterMovedCB, this);
                widget.addListener("removeMenu", this._splitterRemoveMenuCB, this);
                this.getWindowManager().addToOverlay(widget, "aboveDock");
            }

            var widget = this._splitterWidgets[ind];
            widget.resetWidth();
            widget.resetHeight();
            widget.show();
            return widget;
        },

        _getAreaWidget : function ( ind )
        {
            if ( this._areaWidgets == null ) {
                this._areaWidgets = [];
            }
            if ( this._areaWidgets[ind] == null ) {
                var widget = new dockable.DockArea();
                this.add(widget, {});
                this._areaWidgets[ind] = widget;
            }

            var widget = this._areaWidgets[ind];
            widget.show();
            return widget;
        },

        /**
         * callback for splitter moved events
         * @private
         */
        _splitterMovedCB : function ( ev )
        {
            var data = ev.getData();
            var dInfo = data.splitter.getUserData("dockInfo");

            if ( data.splitter.getOrientation() == "horizontal" ) {
                dInfo.layout.adjustRowToStartAt(dInfo.ind, data.pos);
            }
            else {
                dInfo.layout.adjustColumnToStartAt(dInfo.ind, data.pos);
            }
            this._afterLayoutRectanglesAdjusted();
        },

        /**
         * callback for splitter removeMenu events
         * @private
         */
        _splitterRemoveMenuCB : function ( ev )
        {
            var data = ev.getData();
            var dInfo = data.splitter.getUserData("dockInfo");

            if ( data.splitter.getOrientation() == "horizontal" ) {
                dInfo.layout.removeRow(dInfo.ind - 1);
            }
            else {
                dInfo.layout.removeColumn(dInfo.ind - 1);
            }
            this._afterLayoutRectanglesAdjusted();
        },

        /**
         * Callback for rendering overlay canvas. Renders the resize bars
         * @param e
         * @private
         */
        _bgOverlayCanvasRedraw : function ( e )
        {
            console.log("Redrawing overlay canvas");
            var data = e.getData();
            var width = data.width;
            var height = data.height;
            var ctx = data.context;
            ctx.clearRect(0, 0, width, height);

            ctx.fillStyle = "rgba(00,128,0,0.5)";
            this.m_layout.forEachLayout(function ( layout )
            {
                if ( layout.isLeafNode() ) return;
                var rect = layout.rectangle();
                for ( var row = 1 ; row < layout.nRows() ; row++ ) {
                    var kidLayout = layout.getKidLayout(row, 0);
                    var kidRect = kidLayout.rectangle();
                    var y = kidRect.top - kidLayout.getGap() / 2;
                    ctx.fillRect(rect.left, y, rect.width, kidLayout.getGap());
                    //                    console.log(rect.left, y, rect.width, kidLayout.getGap());

                }
                for ( var col = 1 ; col < layout.nCols() ; col++ ) {
                    var kidLayout = layout.getKidLayout(0, col);
                    var kidRect = kidLayout.rectangle();
                    var x = kidRect.left - kidLayout.getGap() / 2;
                    ctx.fillRect(x, rect.top, kidLayout.getGap(), rect.height);
                }
            });
        },

        /**
         * Callback for desktop resize
         * @param e {Event}
         * @private
         */
        _onDesktopResize : function ( e )
        {
            var bounds = e.getData();

            // recompute the geometries of the layout using this new size
            this.m_layout.recomputeRectangles({
                left : 0,
                top : 0,
                width : bounds.width,
                height : bounds.height
            });

            this._afterLayoutRectanglesAdjusted();
        },

        _afterLayoutRectanglesAdjusted : function ()
        {
            // re-render the layout bars
            this._updateUnderlay();
            this.m_overlayCanvas.update();
            this._updateResizeWidgets();

            // go through our list of windows and resize the docked ones
            this.getWindows().forEach(function ( win )
            {
                var layout = win.dockLayout();
                if ( layout != null ) {
                    win.setPositionRect(layout.rectangle(), 1);
                }
            });
        },

//        addd : function ( win )
//        {
//            this.add(win);
//            win.addListener("moving", this._windowMovingCB.bind(this, win));
//            win.addListener("movingDone", this._windowMovingDoneCB.bind(this, win));
//            win.addListener("movingStart", this._windowMovingStartCB.bind(this, win));
//
//            this.getWindowManager().updateStack();
//        },

        /**
         * Overrides the method {@link qx.ui.core.Widget#_afterAddChild}
         *
         * @param win {qx.ui.core.Widget} added widget
         */
        _afterAddChild : function(win)
        {
            this.base( arguments, win);
            if (qx.Class.isDefined("dockable.Window") && win instanceof dockable.Window) {
                win.addListener("moving", this._windowMovingCB.bind(this, win));
                win.addListener("movingDone", this._windowMovingDoneCB.bind(this, win));
                win.addListener("movingStart", this._windowMovingStartCB.bind(this, win));

                this.getWindowManager().updateStack();
            }
        },


        _windowMovingDoneCB : function ( win )
        {
            win.setDockLayout(this.m_selectedLayout);
            if ( this.m_selectedLayout != null ) {
                //                win.setPositionRect(this.m_selectedLayout.rectangle());
                this.m_selectedLayout.setTenant(win);
                this.m_selectedLayout = null;
            }
            this._updateUnderlay();
            this.getWindowManager().updateStack();
        },

        _windowMovingStartCB : function ( win )
        {
            var currLayout = win.dockLayout();
            if ( currLayout != null ) {
                currLayout.setTenant(null);
                win.setDockLayout(null);
                this.m_selectedLayout = currLayout;
            }
            this._updateUnderlay();
            this.getWindowManager().updateStack();
        },

        _windowMovingCB : function ( win, e )
        {
            // unoccupy the layout of this window
            var windowCurrentLayout = win.dockLayout();
            if ( windowCurrentLayout != null ) {
                win.setDockLayout(null);
                windowCurrentLayout.setTenant(null);
            }

            // get relative mouse position wrt to the desktop
            var mousePos = e.getData();
            mousePos.x -= this.getContentLocation().left;
            mousePos.y -= this.getContentLocation().top;

            // find layout under cursor (only consider available layouts)
            var nExamined = 0;
            var selectedLayout = null;
            //            this.m_selectedLayout = null;
            this.m_layout.forEachLayout(function ( layout )
            {
                nExamined++;
                if ( layout.isOccupied() ) return;

                var rect = layout.rectangle();
                var inside = rect.left < mousePos.x && mousePos.x < rect.left + rect.width
                    && rect.top < mousePos.y && mousePos.y < rect.top + rect.height;

                // if this is a composite node, we skip it's kids if we are not inside rectangle
                if ( !layout.isLeafNode() ) {
                    return inside ? "" : "skip";
                }

                if ( inside ) {
                    selectedLayout = layout;
                    return "break";
                }
            }.bind(this));
            console.log("nExamined", nExamined);

            // update the underlay with the selected layout
            if ( selectedLayout !== this.m_selectedLayout ) {
                this.m_selectedLayout = selectedLayout;
                this._updateUnderlay();
            }
        },

        /**
         * Data members
         */
        m_layout : null,
        m_selectedLayout : null,
        m_overlayCanvas : null,
        _splitterWidgets : null

    }
});
