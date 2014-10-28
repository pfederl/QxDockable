qx.Class.define("dockable.Desktop", {

    extend : qx.ui.core.Widget,

    include : [qx.ui.core.MChildrenHandling, qx.ui.window.MDesktop, qx.ui.core.MBlocker],

    implement : qx.ui.window.IDesktop,

    construct : function ()
    {
        this.base(arguments);
        var windowManager = new dockable.WindowManager();
        this.getContentElement().disableScrolling();
        this._setLayout(new qx.ui.layout.Canvas().set({
            desktop : true
        }));
        this.setWindowManager(windowManager);
        this.m_bgCanvas = new qx.ui.embed.Canvas().set(
            {
                canvasWidth : 200,
                canvasHeight : 200,
                syncDimension : true,
                anonymous : true
            });
        this.m_bgCanvas.addListener("redraw", this._bgCanvasRedraw, this);
        this.add(this.m_bgCanvas,
            {
                left : 0,
                top : 0,
                edge : 0
            });
        this.m_bgCanvas.setZIndex(2e5);
        this.m_bgCanvas.getContentElement().setStyle("pointer-events", "none", true);
        this.addListener("resize", this._onDesktopResize, this);

        this.m_previewWidget = new qx.ui.core.Widget();
        this.m_previewWidget.setBackgroundColor("blue");
        this.add(this.m_previewWidget);
    },

    members : {

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
         * Callback for rendering the canvas. Renders the resize bars
         * @param e
         * @private
         */
        _bgCanvasRedraw : function ( e )
        {
            var data = e.getData();
            var width = data.width;
            var height = data.height;
            var ctx = data.context;
            ctx.fillStyle = "rgba(200,0,0,0.1)";
//            this.m_allLeafLayouts = [];
//            this._renderBgCanvas(ctx, this.m_layout, 0, 0, width, height);
//            console.log("Number of rectangles:", this.m_allLeafLayouts.length);


            ctx.fillStyle = "rgba(00,255,0,0.1)";
            this.m_allLeafLayouts.forEach(function(layout){
                var r = layout.rectangle();
                ctx.fillRect(r.left+2, r.top+2, r.width-4, r.height-4);
            });

        },

        _renderBgCanvas : function ( ctx, layout, left, top, width, height )
        {
            if ( layout.isLeafNode() ) {
                this.m_allLeafLayouts.push({
                    left : left, top : top, width : width, height : height
                });
                return;
            }
            console.log("renderBGcanvas", arguments);

            var x = left;
            for ( var col = 0 ; col < layout.cols - 1 ; col++ ) {
                x += layout.colSizes[col] + layout.HandleSize;
                //                ctx.fillRect( x - layout.HandleSize/2, top, layout.HandleSize, height);
                ctx.fillRect(x - layout.HandleSize, top, layout.HandleSize, height);
            }
            var y = top;
            for ( var row = 0 ; row < layout.rows - 1 ; row++ ) {
                y += layout.rowSizes[row] + layout.HandleSize;
                //                ctx.fillRect( left, y - layout.HandleSize/2, width, layout.HandleSize);
                ctx.fillRect(left, y - layout.HandleSize, width, layout.HandleSize);
            }
            // now kids
            var kidIndex = 0;
            y = top;
            for ( var row = 0 ; row < layout.rows ; row++ ) {
                x = left;
                for ( var col = 0 ; col < layout.cols ; col++ ) {
                    this._renderBgCanvas(ctx, layout.kids[ kidIndex], x, y, layout.colSizes[col],
                        layout.rowSizes[row]);
                    x += layout.colSizes[col] + layout.HandleSize;
                    kidIndex++;
                }
                y += layout.rowSizes[row] + layout.HandleSize;
            }

        },

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

            //            var sum = 0;
            //            for ( var col = 0 ; col < this.m_layout.cols ; col++ ) {
            //                sum += this.m_layout.colSizes[col];
            //            }
            //            console.log("sum", sum, "width=", bounds.width);

            // get the list of all rectangles for all layouts (but only the leaf ones)
            this.m_allLeafLayouts = [];
            this.m_layout.forEachLayout(function ( layout )
            {
                if ( layout.isLeafNode() ) {
                    this.m_allLeafLayouts.push(layout);
                }
            }.bind(this));
            // re-render the layout bars
            this.m_bgCanvas.update();
            // update the list of rectangles
            //            this._updateRectangles( this.m_layout);

            // go through our list of windows and resize the docked ones
            this.getWindows().forEach( function(win) {
                var layout = win.getUserData("dockLayout");
                if( layout != null) {
                    win.setPositionRect( layout.rectangle());
                }
            });

        },

        //        _updateRectangles:function( layout) {
        //
        //        },
        addd : function ( win )
        {
            this.add(win);
            win.addListener("moving", this._windowMovingCB.bind(this, win));
            win.addListener("movingDone", this._windowMovingDoneCB.bind(this, win));
        },

        _windowMovingDoneCB : function ( win )
        {
            var layout = win.getUserData("dockLayout");
            if ( layout == null ) return;

            win.setPositionRect(layout.rectangle());
        },

        _windowMovingCB : function ( win, e )
        {
            console.log("mooving", e.getData());
            var me = win.getContentElement().getDomElement();
            me =
            {
                left : me.offsetLeft,
                top : me.offsetTop
            };

            var mousePos = e.getData();
            mousePos.x -= this.getContentLocation().left;
            mousePos.y -= this.getContentLocation().top;

            for ( var id in this.m_allLeafLayouts ) {
                var layout = this.m_allLeafLayouts[id];
                var rect = layout.rectangle();
                if ( rect.left < mousePos.x && mousePos.x < rect.left + rect.width
                    && rect.top < mousePos.y && mousePos.y < rect.top + rect.height ) {
                    //                    win.moveTo( rect.left, rect.top);
                    //                    win.setWidth( rect.width);
                    //                    win.setHeight( rect.height);
                    this.m_previewWidget.setUserBounds(rect.left, rect.top, rect.width, rect.height);
                    win.setUserData("dockLayout", layout);
                    return;
                }
            }
            win.setUserData("dockLayout", null);

            return;

/*
            var wins = this.getWindows();
            var me = win.getBounds();
            me = win.getContentElement().getDomElement();

            //            console.log(me);
            me =
            {
                left : me.offsetLeft,
                top : me.offsetTop
            };

            //            window.me = me;
            for ( var i = 0 ; i < wins.length ; i++ ) {
                if ( wins[i] === win )continue;

                //                console.log( "processing", wins[i]);
                var lp = wins[i].getBounds();

                //                console.log( "layoutprops", lp);
                var left = lp.left + Math.random() * 0.1 * (me.left - lp.left);
                var top = lp.top + Math.random() * 0.1 * (me.top - lp.top);
                left += Math.random() * 20 - 10;
                top += Math.random() * 20 - 10;
                left = Math.round(left);
                top = Math.round(top);
                wins[i].moveTo(left, top);
            }
*/
        },

        /**
         * Data members
         */
        m_layout : null
    }
});
