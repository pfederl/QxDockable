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

        this.m_previewWidget = new qx.ui.core.Widget();
        this.m_previewWidget.setBackgroundColor("rgba(255,0,0,0.5)");
        this.m_previewWidget.setZIndex(2e5 + 1);
        this.m_previewWidget.exclude();
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
            ctx.fillStyle = "rgba(200,0,0,0.1)";

            this.m_layout.forEachLayout(function ( layout )
            {
                if ( !layout.isLeafNode() ) return;
                if ( layout.isOccupied() ) return;

                var r = layout.rectangle();
                ctx.fillRect(r.left, r.top, r.width, r.height);
            });
        },

        /**
         * Callback for rendering overlay canvas. Renders the resize bars
         * @param e
         * @private
         */
        _bgOverlayCanvasRedraw : function ( e )
        {
            var data = e.getData();
            var width = data.width;
            var height = data.height;
            var ctx = data.context;
            ctx.fillStyle = "rgba(200,0,0,0.1)";
            //            this.m_allLeafLayouts = [];
            //            this._renderBgCanvas(ctx, this.m_layout, 0, 0, width, height);
            //            console.log("Number of rectangles:", this.m_allLeafLayouts.length);

            ctx.fillStyle = "rgba(00,255,0,0.5)";
            //            this.m_allLeafLayouts.forEach(function ( layout )
            //            {
            //                var r = layout.rectangle();
            //                ctx.fillRect(r.left, r.top, r.width, r.height);
            //            });

            this.m_layout.forEachLayout(function ( layout )
            {
                if ( !layout.isLeafNode() ) return;
                var r = layout.rectangle();
                ctx.fillRect(r.left, r.top, r.width, r.height);
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

            // get the list of all rectangles for all layouts (but only the leaf ones)
            this.m_allLeafLayouts = [];
            this.m_layout.forEachLayout(function ( layout )
            {
                if ( layout.isLeafNode() ) {
                    this.m_allLeafLayouts.push(layout);
                }
            }.bind(this));
            // re-render the layout bars
            this.m_underlayCanvas.update();
            this.m_overlayCanvas.update();
            // update the list of rectangles
            //            this._updateRectangles( this.m_layout);

            // go through our list of windows and resize the docked ones
            this.getWindows().forEach(function ( win )
            {
//                var layout = win.getUserData("dockLayout");
                var layout = win.dockLayout();
                if ( layout != null ) {
                    win.setPositionRect(layout.rectangle(), 1);
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
            win.addListener("movingStart", this._windowMovingStartCB.bind(this, win));

            this.getWindowManager().updateStack();
        },

        _windowMovingDoneCB : function ( win )
        {
            // if we didn't find a layout for this window, we are done
            win.setDockLayout( this.m_selectedLayout);
            if ( this.m_selectedLayout == null ) return;
            win.setPositionRect(this.m_selectedLayout.rectangle());
            this.m_selectedLayout.setTenant(win);
            this.m_selectedLayout = null;
            this.m_previewWidget.hide();

            this.m_underlayCanvas.update();
            this.getWindowManager().updateStack();
        },

        _windowMovingStartCB : function ( win )
        {
            var currLayout = win.dockLayout();
            if( currLayout != null) {
                currLayout.setTenant(null);
                win.setDockLayout(null);
                this.m_selectedLayout = currLayout;
            }
            this.m_underlayCanvas.update();
        },

        _windowMovingCB : function ( win, e )
        {
            //            console.log("mooving", e.getData());
            //            var me = win.getContentElement().getDomElement();
            //            me =
            //            {
            //                left : me.offsetLeft,
            //                top : me.offsetTop
            //            };

            // unoccupy the layout of this window
            var windowCurrentLayout = win.dockLayout();
            if ( windowCurrentLayout != null ) {
                win.setDockLayout( null);
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

            // if we found an available layout, set the preview for it
            if ( this.m_selectedLayout != null ) {
                var rect = this.m_selectedLayout.rectangle();
                this.m_previewWidget.setUserBounds(rect.left, rect.top, rect.width, rect.height);
                this.m_previewWidget.show();
            }
            else {
                this.m_previewWidget.exclude();
            }

            this.m_underlayCanvas.update();

        },

        /**
         * Data members
         */
        m_layout : null,
        m_previewWidget : null,
        m_selectedLayout : null,
        m_overlayCanvas : null

    }
});
