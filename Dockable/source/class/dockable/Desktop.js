/**
 * replacement for qx.ui.window.Desktop with dockable window capabilities.
 */

qx.Class.define("dockable.Desktop", {

    //    extend : qx.ui.core.Widget,
    //
    //    include : [qx.ui.core.MChildrenHandling, qx.ui.window.MDesktop, qx.ui.core.MBlocker],
    //
    //    implement : qx.ui.window.IDesktop,

    extend : qx.ui.window.Desktop,

    construct : function ()
    {
        var windowManager = new dockable.WindowManager();
        this.base(arguments, windowManager);
        //        this.getContentElement().disableScrolling();
        //        this._setLayout(new qx.ui.layout.Canvas().set({
        //            desktop : true
        //        }));
        //        this.setWindowManager(windowManager);

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

        this._resizeWidgets = [];
        //
        //        var widget=new qx.ui.core.Widget();
        //        widget.set({ backgroundColor: "rgba(255,0,0,0.01)", zIndex: 2e5+1, width: 10,
        //        cursor: "col-resize"});
        ////        widget.getContentElement().setStyle("pointer-events", "none", true);
        //        this.add( widget, { left: 100, top: 0, bottom: 0});
    },

    members : {

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
         * Callback for rendering the underlay canvas.
         * @param e
         * @private
         */
        _bgUnderlayCanvasRedraw : function ( e )
        {
            var data = e.getData();
            var width = data.width;
            var height = data.height;
            var ctx = data.context;
            ctx.clearRect(0, 0, width, height);
            ctx.fillStyle = "rgba(0,0,0,0.1)";
            if ( ctx.setLineDash ) {
                ctx.setLineDash([5, 2]);
            }

            this.m_layout.forEachLayout(function ( layout )
            {
                if ( !layout.isLeafNode() ) return;
                if ( layout.isOccupied() ) return;

                var r = layout.rectangle();
                ctx.fillRect(r.left, r.top, r.width, r.height);
            });

            if ( this.m_selectedLayout != null ) {
                ctx.fillStyle = "rgba(0,0,0,0.1)";
                var r = this.m_selectedLayout.rectangle();
                //                ctx.fillRect(r.left, r.top, r.width, r.height);
                var w = 3;
                ctx.lineWidth = w;
                ctx.strokeStyle = "rgba(0,0,0,1)";
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
                    var y = kidRect.top - layout.HandleSize / 2;
                    var rw = this._getResizeWidget(count);
                    rw.setOrientation("horizontal");
                    rw.setPos(rect.left, rect.width, y, kidRectPrev.top, kidRect.top + kidRect.height);
                    rw.setUserData("index", row);
                    count++;
                }
                for ( var col = 1 ; col < layout.nCols() ; col++ ) {
                    var kidRectPrev = layout.getKidLayout(0, col - 1).rectangle();
                    var kidRect = layout.getKidLayout(0, col).rectangle();
                    var x = kidRect.left - layout.HandleSize / 2;
                    var rw = this._getResizeWidget(count);
                    rw.setOrientation("vertical");
                    rw.setPos(rect.top, rect.height, x, kidRectPrev.left, kidRect.left + kidRect.width);
                    rw.setUserData("index", col);
                    count++;
                }
            }.bind(this));
            console.log("count", count);
            // hide unused splitters
            for ( var ind = count ; ind < this._resizeWidgets.length ; ind++ ) {
                this._resizeWidgets[ind].exclude();
            }
        },

        _getResizeWidget : function ( ind )
        {
            if ( this._resizeWidgets[ind] == null ) {
                var widget = new dockable.DockAreaSplitter();
                widget.setThickness(5);
                widget.set({ zIndex : 2e5 + 1 });
                this.add(widget, {});
                this._resizeWidgets[ind] = widget;
                widget.addListener("moved", this._splitterCB, this);
            }

            var widget = this._resizeWidgets[ind];
            widget.resetWidth();
            widget.resetHeight();
            widget.show();
            widget.clearLayoutProperties();
            return widget;
        },

        /**
         * callback for splitters
         * @private
         */
        _splitterCB : function ( ev )
        {
            var data = ev.getData();
            var splitter = data.splitter;
            var pos = data.pos;
            var ind = splitter.getUserData("index");
            if ( splitter.getOrientation() === "horizontal" ) {

            }
            else {

            }
            console.log("moved to:", pos, data);
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
                    var y = kidRect.top - kidLayout.HandleSize / 2;
                    ctx.fillRect(rect.left, y, rect.width, kidLayout.HandleSize);
                    //                    console.log(rect.left, y, rect.width, kidLayout.HandleSize);

                }
                for ( var col = 1 ; col < layout.nCols() ; col++ ) {
                    var kidLayout = layout.getKidLayout(0, col);
                    var kidRect = kidLayout.rectangle();
                    var x = kidRect.left - kidLayout.HandleSize / 2;
                    ctx.fillRect(x, rect.top, kidLayout.HandleSize, rect.height);
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
            this.m_underlayCanvas.update();
            this.m_overlayCanvas.update();
            this._updateResizeWidgets();

            // go through our list of windows and resize the docked ones (use animation effect)
            this.getWindows().forEach(function ( win )
            {
                var layout = win.dockLayout();
                if ( layout != null ) {
                    win.setPositionRect(layout.rectangle(), 1);
                }
            });
        },

        addd : function ( win )
        {
            this.add(win);
            win.addListener("moving", this._windowMovingCB.bind(this, win));
            win.addListener("movingDone", this._windowMovingDoneCB.bind(this, win));
            win.addListener("movingStart", this._windowMovingStartCB.bind(this, win));

            this.getWindowManager().updateStack();
        },

        _windowMovingDoneCB : function ( win )
        {
            // if we didn't find a layout for this window, we are done
            win.setDockLayout(this.m_selectedLayout);
            if ( this.m_selectedLayout == null ) return;
            win.setPositionRect(this.m_selectedLayout.rectangle());
            this.m_selectedLayout.setTenant(win);
            this.m_selectedLayout = null;
            //            this.m_previewWidget.hide();

            this.m_underlayCanvas.update();
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
            this.m_underlayCanvas.update();
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
            this.m_selectedLayout = null;
            this.m_layout.forEachLayout(function ( layout )
            {
                if ( !layout.isLeafNode() ) return;
                if ( layout.isOccupied() ) return;

                var rect = layout.rectangle();
                if ( rect.left < mousePos.x && mousePos.x < rect.left + rect.width
                    && rect.top < mousePos.y && mousePos.y < rect.top + rect.height ) {
                    this.m_selectedLayout = layout;
                    return "break";
                }
            }.bind(this));

            this.m_underlayCanvas.update();
        },

        /**
         * Data members
         */
        m_layout : null,
        m_selectedLayout : null,
        m_overlayCanvas : null,
        _resizeWidgets : null

    }
});
